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
  Checkbox
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

  const [selectedFriends, setSelectedFriends] = useState([]);

  const handleFriendSelection = (friendId) => {
    setSelectedFriends((prevSelected) => {
      if (prevSelected.includes(friendId)) {
        // Odebrat přítele ze seznamu
        return prevSelected.filter((id) => id !== friendId);
      } else if (prevSelected.length < 5) {
        // Přidat přítele do seznamu
        return [...prevSelected, friendId];
      } else {
        // Pokud je dosažen limit 5 přátel
        alert("Můžete vybrat maximálně 5 přátel.");
        return prevSelected;
      }
    });
  };



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

        // Získat seznam uživatelských ID: přihlášený uživatel + vybraní přátelé
        const userIds = [user.id, ...selectedFriends];

        // Filtrovat logy pouze pro vybrané uživatele
        const filteredLogs = allLogs.filter((log) => userIds.includes(log.user_id));

        // Mapa uživatelských ID na uživatelská jména
        const userMap = {
          [user.id]: "Já",
          ...friends
            .filter((friend) => selectedFriends.includes(friend.id))
            .reduce((acc, friend) => {
              acc[friend.id] = friend.name || friend.username;
              return acc;
            }, {}),
        };

        // Příprava barev pro uživatele
        const colorPalette = [
          "#8884d8",
          "#82ca9d",
          "#ffc658",
          "#ff8042",
          "#a4de6c",
          "#d0ed57",
          "#8dd1e1",
          // Přidejte více barev podle potřeby
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
            const user = userMap[id];
            dataForDate[user] = 0;
          });

          filteredLogs
            .filter((log) => new Date(log.log_date).getDate() === date.getDate())
            .forEach((log) => {
              const user = userMap[log.user_id];
              dataForDate[user] += log.duration;
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


  useEffect(() => {
    fetchLogs();
  }, [selectedEvent, user.id, selectedMonth, selectedYear, friends, selectedFriends]);




  useEffect(() => {
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

          <Typography variant="subtitle1">Vyberte přátele k zobrazení:</Typography>
          <List dense>
            {friends.map((friend) => (
              <ListItem key={friend.id} dense>
                <ListItemText primary={friend.name || friend.username} />
                <Checkbox
                  edge="end"
                  onChange={() => handleFriendSelection(friend.id)}
                  checked={selectedFriends.includes(friend.id)}
                  disabled={
                    !selectedFriends.includes(friend.id) && selectedFriends.length >= 5
                  }
                />
              </ListItem>
            ))}
          </List>


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
                  <YAxis width={10}/>
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
