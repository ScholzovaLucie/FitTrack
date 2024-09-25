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
  const [friends, setFriends] = useState([]);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());


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
  }, [selectedEvent, user.id, selectedMonth, selectedYear]);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const { data: friendIds, error: friendsError } = await supabase
          .from('friends')
          .select('friend_id')
          .eq('user_id', user.id);

        if (friendsError) {
          setError('Chyba při načítání ID přátel: ' + friendsError.message);
          return;
        }

        const friendIdList = friendIds.map(friend => friend.friend_id);
        
        const { data: friendDetails, error: usersError } = await supabase
          .from('users')
          .select('*')
          .in('id', friendIdList);  // Filtruj uživatele podle friend_id

        if (usersError) {
          setError('Chyba při načítání informací o uživatelích: ' + usersError.message);
          return;
        }

        setFriends(friendDetails);
      } catch (err) {
        setError('Došlo k chybě: ' + err.message);
      }
    };

    fetchFriends();
  }, [selectedEvent, user.id, selectedMonth, selectedYear]);

  useEffect(() => {
    const fetchLogs = async () => {
      if (selectedEvent) {
        try {
          const startDate = new Date(selectedYear, selectedMonth, 1);
          const endDate = new Date(selectedYear, selectedMonth + 1, 0);
          // Načíst logy pro aktuálního uživatele
          const { data: userLogs, error: userError } = await supabase
          .from("event_logs")
          .select("*")
          .eq("event_id", selectedEvent)
          .eq("user_id", user.id)
          .gte('log_date', startDate.toISOString())
          .lte('log_date', endDate.toISOString());

          if (userError) {
            setError("Chyba při načítání logů uživatele: " + userError.message);
            return;
          }

         const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
        const baseData = daysInMonth.map(date => ({
          date: date.toLocaleDateString(),
          duration: 0,
        }));

        // Sloučit logy uživatele s baseData
        const userLogData = [...baseData];

        userLogs.forEach(log => {
          const date = new Date(log.log_date).toLocaleDateString();
          const logEntry = userLogData.find(item => item.date === date);
          if (logEntry) {
            logEntry.duration += log.duration;
          }
        });

          // Načíst všechny logy pro přátele najednou
          const { data: allLogs, error: logsError } = await supabase
          .from("event_logs")
          .select("*")
          .eq("event_id", selectedEvent)
          .gte('log_date', startDate.toISOString())
          .lte('log_date', endDate.toISOString());

          if (logsError) {
            setError("Chyba při načítání logů přátel: " + logsError.message);
            return;
          }

          console.log("Všechny logy pro event:", allLogs); // Přidej log pro kontrolu

          // Filtrovat logy podle user_id pro přátele
          const friendLogsData = [...baseData];

        allLogs
          .filter(log => log.user_id !== user.id)
          .forEach(log => {
            const date = new Date(log.log_date).toLocaleDateString();
            const logEntry = friendLogsData.find(item => item.date === date);
            if (logEntry) {
              logEntry.duration += log.duration;
            }
          });

          setLogs({ user: userLogData, friends: friendLogsData });
        } catch (err) {
          setError("Došlo k chybě: " + err.message);
        }
      }
    };

    fetchLogs();
  }, [selectedEvent, user.id, selectedMonth, selectedYear]);

  const getDaysInMonth = (month, year) => {
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

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
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
  <Button onClick={() => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  }}>
    Předchozí měsíc
  </Button>
  <Typography variant="h6" style={{ margin: '0 20px' }}>
    {new Date(selectedYear, selectedMonth).toLocaleString('cs-CZ', { month: 'long', year: 'numeric' })}
  </Typography>
  <Button onClick={() => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  }}>
    Následující měsíc
  </Button>
</div>
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
    <ListItemText primary="Žádné záznamy pro tento měsíc." />
  </ListItem>
)}

{logs.friends.length > 0 ? (
  <div>
    <Typography variant="subtitle1">Graf přátel:</Typography>
    <BarChart width={600} height={300} data={logs.friends}>
      <CartesianGrid strokeDasharray="3 3" />
      <CustomYAxis dataKey="duration" />
      <XAxis dataKey="date" />
      <Tooltip />
      <Bar dataKey="duration" fill="#82ca9d" />
    </BarChart>
  </div>
) : (
  <Typography variant="body2">
    Žádné záznamy přátel pro tento měsíc.
  </Typography>
)}
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
