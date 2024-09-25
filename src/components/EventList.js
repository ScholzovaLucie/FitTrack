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
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import supabase from "../supabaseClient";
import { useAuth } from "../AuthContext";
import AddLog from "./AddLog";

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

          // Načíst všechny logy pro vybraný event a časový rozsah
          const { data: allLogs, error: logsError } = await supabase
            .from("event_logs")
            .select("*")
            .eq("event_id", selectedEvent)
            .gte("log_date", startDate.toISOString())
            .lte("log_date", endDate.toISOString());

          if (logsError) {
            setError("Chyba při načítání logů: " + logsError.message);
            return;
          }

          // Získat seznam všech uživatelů (ID) zapojených do logů
          const userIds = [...new Set(allLogs.map((log) => log.user_id))];

          // Mapa uživatelských ID na uživatelská jména
          const userMap = {
            [user.id]: "Já",
            ...friends.reduce((acc, friend) => {
              acc[friend.id] = friend.username;
              return acc;
            }, {}),
          };

          // Pokud jsou v logách další uživatelé, načtěte jejich uživatelská jména
          const unknownUserIds = userIds.filter((id) => !userMap[id]);
          if (unknownUserIds.length > 0) {
            const { data: otherUsers, error: usersError } = await supabase
              .from("users")
              .select("id, username")
              .in("id", unknownUserIds);

            if (usersError) {
              setError("Chyba při načítání uživatelů: " + usersError.message);
              return;
            }

            otherUsers.forEach((u) => {
              userMap[u.id] = u.username;
            });
          }

          // Příprava barev pro uživatele
          const colorPalette = [
            "#8884d8",
            "#82ca9d",
            "#ffc658",
            "#ff8042",
            "#a4de6c",
            "#d0ed57",
            "#8dd1e1",
          ];
          const colors = {};
          userIds.forEach((id, index) => {
            colors[id] = colorPalette[index % colorPalette.length];
          });

          // Příprava dat pro graf
          const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
          const chartData = daysInMonth.map((date) => {
            const dateString = date.getDate().toString();
            const dataForDate = { date: dateString };

            userIds.forEach((id) => {
              const username = userMap[id];
              dataForDate[username] = 0;
            });

            allLogs
              .filter(
                (log) =>
                  new Date(log.log_date).getDate() === date.getDate()
              )
              .forEach((log) => {
                const username = userMap[log.user_id];
                dataForDate[username] += log.duration;
              });

            return dataForDate;
          });

          setLogs({
            data: chartData,
            colors,
            userMap,
          });
        } catch (err) {
          setError("Došlo k chybě: " + err.message);
        }
      }
    };

    fetchLogs();
  }, [selectedEvent, user.id, selectedMonth, selectedYear, friends]);
  

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
          {/* Ovládací prvky pro přepínání měsíců */}
          <div
            style={{ display: "flex", alignItems: "center", marginBottom: "20px", justifyContent: "center" }}
          >
            <Button
              onClick={() => {
                if (selectedMonth === 0) {
                  setSelectedMonth(11);
                  setSelectedYear(selectedYear - 1);
                } else {
                  setSelectedMonth(selectedMonth - 1);
                }
              }}
            >
              &#8592;
            </Button>
            <Typography variant="h6" style={{ margin: "0 20px" }}>
              {new Date(selectedYear, selectedMonth).toLocaleString("cs-CZ", {
                month: "long",
                year: "numeric",
              })}
            </Typography>
            <Button
              onClick={() => {
                if (selectedMonth === 11) {
                  setSelectedMonth(0);
                  setSelectedYear(selectedYear + 1);
                } else {
                  setSelectedMonth(selectedMonth + 1);
                }
              }}
            >
              &#8594;
            </Button>
          </div>

          {/* Graf aktivity */}
          {logs.data && logs.data.length > 0 ? (
  <div>
    <Typography variant="subtitle1">Graf aktivity:</Typography>
    <ResponsiveContainer width="100%" height={400}>
                <BarChart data={logs.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    label={{ value: 'Den', position: 'insideBottom', offset: -5 }}
                    interval={0}
                    tick={{ angle: 0, textAnchor: 'middle' }}
                    height={40}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {Object.keys(logs.userMap).map((userId) => (
                    <Bar
                      key={userId}
                      dataKey={logs.userMap[userId]}
                      fill={logs.colors[userId]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
  </div>
) : (
  <Typography variant="body2">Žádné záznamy pro tento měsíc.</Typography>
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
