import React, { useEffect, useState } from "react";
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  Alert,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import supabase from "../supabaseClient";
import { useAuth } from "../AuthContext";
import AddLog from "./AddLog";

const CustomYAxis = ({ domain = [0, "dataMax"], ...props }) => {
  return <YAxis domain={domain} {...props} />;
};

const EventList = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [logs, setLogs] = useState({ user: [], friends: [] });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [error, setError] = useState("");
  const [openAddLog, setOpenAddLog] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data: userEvents, error: userError } = await supabase
          .from("events")
          .select("*")
          .eq("created_by", user.id);

        if (userError) {
          setError("Chyba při načítání eventů: " + userError.message);
          return;
        }

        const { data: participantData, error: participantError } =
          await supabase
            .from("event_participants")
            .select("user_id, event_id")
            .eq("user_id", user.id);

        if (participantError) {
          setError(
            "Chyba při načítání účastníků eventů: " + participantError.message
          );
          return;
        }

        const eventIds = participantData.map(
          (participant) => participant.event_id
        );

        const { data: sharedEvents, error: sharedError } = await supabase
          .from("events")
          .select("*")
          .in("id", eventIds);

        if (sharedError) {
          setError(
            "Chyba při načítání sdílených eventů: " + sharedError.message
          );
          return;
        }

        setEvents([...userEvents, ...sharedEvents]);
      } catch (err) {
        setError("Došlo k chybě: " + err.message);
      }
    };

    fetchEvents();
  }, [user.id, events]);

  useEffect(() => {
    const fetchLogs = async () => {
      if (selectedEvent) {
        try {
          // Načíst logy pro aktuálního uživatele
          const { data: userLogs, error: userError } = await supabase
            .from("event_logs")
            .select("*")
            .eq("event_id", selectedEvent)
            .eq("user_id", user.id);

          if (userError) {
            setError("Chyba při načítání logů uživatele: " + userError.message);
            return;
          }

          console.log("Logy uživatele:", userLogs); // Přidej log pro kontrolu

          // Zpracování logů uživatele
          const userLogData = userLogs.reduce((acc, log) => {
            const date = new Date(log.log_date).toLocaleDateString();
            const existingLog = acc.find((item) => item.date === date);

            if (existingLog) {
              existingLog.duration += log.duration; // Sečíst trvání
            } else {
              acc.push({ date, duration: log.duration }); // Přidat nový záznam
            }

            return acc;
          }, []);

          // Načíst všechny logy pro přátele najednou
          const { data: allLogs, error: logsError } = await supabase
            .from("event_logs")
            .select("*")
            .eq("event_id", selectedEvent);

          if (logsError) {
            setError("Chyba při načítání logů přátel: " + logsError.message);
            return;
          }

          console.log("Všechny logy pro event:", allLogs); // Přidej log pro kontrolu

          // Filtrovat logy podle user_id pro přátele
          const friendLogData = allLogs
            .filter((log) => log.user_id !== user.id)
            .reduce((acc, log) => {
              const date = new Date(log.log_date).toLocaleDateString();
              const existingLog = acc.find((item) => item.date === date);

              if (existingLog) {
                existingLog.duration += log.duration; // Sečíst trvání
              } else {
                acc.push({ date, duration: log.duration }); // Přidat nový záznam
              }

              return acc;
            }, []);

          console.log("Logy přátel:", friendLogData); // Přidej log pro kontrolu

          setLogs({ user: userLogData, friends: friendLogData });
        } catch (err) {
          setError("Došlo k chybě: " + err.message);
        }
      }
    };

    fetchLogs();
  }, [selectedEvent, user.id]);

  return (
    <Paper style={{ padding: "20px" }}>
      <Typography variant="h5">Moje eventy</Typography>
      {error && <Alert severity="error">{error}</Alert>}

      <List>
        {events.map((event) => (
          <ListItem
            key={event.id}
            button
            onClick={() => {
              setSelectedEvent(event.id);
            }}
          >
            <ListItemText primary={event.event_name} />
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                setSelectedEvent(event.id);
                setOpenAddLog(true); // Otevři popup pro přidání logu
              }}
            >
              Přidat log
            </Button>
          </ListItem>
        ))}
      </List>

      {selectedEvent && (
        <>
          <Typography variant="h6" style={{ marginTop: "20px" }}>
            Záznamy pro vybraný event
          </Typography>
          {logs.user.length > 0 ? (
            <div>
              <Typography variant="subtitle1">Můj graf:</Typography>
              <BarChart width={600} height={300} data={logs.user}>
              <CartesianGrid strokeDasharray="3 3" />
              <CustomYAxis dataKey="duration" />
              <XAxis dataKey="date" />
              <Tooltip />
              <Bar dataKey="duration" fill="#8884d8" />
              </BarChart>
            </div>
          ) : (
            <ListItem>
              <ListItemText primary="Žádné záznamy pro tento event." />
            </ListItem>
          )}

          {logs.friends &&
            logs.friends.length > 0 &&
            logs.friends.map((friendLogs, index) => (
              <div key={index}>
                <Typography variant="subtitle1">
                  Graf přítele {index + 1}:
                </Typography>
                {logs.friends.length > 0 ? (
                  <BarChart width={600} height={300} data={logs.friends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <CustomYAxis dataKey="duration" />
                    <XAxis dataKey="date" />
                    <Tooltip />
                    <Bar dataKey="duration" fill="#82ca9d" />
                  </BarChart>
                ) : (
                  <Typography variant="body2">
                    Žádné logy pro tohoto přítele.
                  </Typography>
                )}
              </div>
            ))}
        </>
      )}

      {/* Dialog pro přidání záznamu */}
      <Dialog open={openAddLog} onClose={() => setOpenAddLog(false)}>
        <DialogTitle>Přidat záznam k eventu</DialogTitle>
        <DialogContent>
          <AddLog
            eventId={selectedEvent}
            onClose={() => setOpenAddLog(false)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddLog(false)} color="primary">
            Zavřít
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default EventList;
