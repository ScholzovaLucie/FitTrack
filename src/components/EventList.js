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

  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());
  const [selectedFriends, setSelectedFriends] = useState([]);

  const handleFriendSelection = (friendId) => {
    setSelectedFriends((prevSelected) => {
      if (prevSelected.includes(friendId)) {
        return prevSelected.filter((id) => id !== friendId);
      } else if (prevSelected.length < 5) {
        return [...prevSelected, friendId];
      } else {
        alert("Můžete vybrat maximálně 5 přátel.");
        return prevSelected;
      }
    });
  };

  function getCurrentWeek() {
    const today = new Date();
    const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1)); // Pondělí
    const lastDayOfWeek = new Date(today.setDate(firstDayOfWeek.getDate() + 6)); // Neděle
    return [firstDayOfWeek, lastDayOfWeek];
  }

  const changeWeek = (direction) => {
    const [startDate, endDate] = selectedWeek;
    const oneWeek = 7 * 24 * 60 * 60 * 1000; // Jeden týden v milisekundách

    const newStartDate =
      direction === "previous"
        ? new Date(startDate.getTime() - oneWeek)
        : new Date(startDate.getTime() + oneWeek);
    const newEndDate = new Date(newStartDate.getTime() + oneWeek - 1);

    setSelectedWeek([newStartDate, newEndDate]);
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

        const { data: participantData, error: participantError } = await supabase
          .from("event_participants")
          .select("user_id, event_id")
          .eq("user_id", user.id);

        if (participantError) {
          setError("Chyba při načítání účastníků eventů: " + participantError.message);
          return;
        }

        const eventIds = participantData.map((participant) => participant.event_id);

        const { data: sharedEvents, error: sharedError } = await supabase
          .from("events")
          .select("*")
          .in("id", eventIds);

        if (sharedError) {
          setError("Chyba při načítání sdílených eventů: " + sharedError.message);
          return;
        }

        setEvents([...userEvents, ...sharedEvents]);
      } catch (err) {
        setError("Došlo k chybě: " + err.message);
      }
    };

    fetchEvents();
  }, [selectedEvent, user.id, selectedWeek]);

  useEffect(() => {
    const fetchFriendsForEvent = async () => {
      if (selectedEvent) {
        try {
          // Načíst ID přátel, kteří jsou účastníky eventu
          const { data: participants, error: participantError } = await supabase
            .from("event_participants")
            .select("user_id")
            .eq("event_id", selectedEvent)
            .neq("user_id", user.id); // Vynecháme aktuálního uživatele

          if (participantError) {
            setError("Chyba při načítání účastníků eventu: " + participantError.message);
            return;
          }

          const participantIds = participants.map((participant) => participant.user_id);

          // Načíst detaily uživatelů (přátel) na základě jejich ID
          const { data: friendDetails, error: usersError } = await supabase
            .from("users")
            .select("*")
            .in("id", participantIds);

          if (usersError) {
            setError("Chyba při načítání informací o uživatelích: " + usersError.message);
            return;
          }

          setFriends(friendDetails);
        } catch (err) {
          setError("Došlo k chybě: " + err.message);
        }
      }
    };

    fetchFriendsForEvent();
  }, [selectedEvent, user.id]);

  const fetchLogs = async () => {
    if (selectedEvent) {
      try {
        const [startDate, endDate] = selectedWeek;

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

        const userIds = [user.id, ...selectedFriends];
        const filteredLogs = allLogs.filter((log) => userIds.includes(log.user_id));

        const userMap = {
          [user.id]: "Já",
          ...friends
            .filter((friend) => selectedFriends.includes(friend.id))
            .reduce((acc, friend) => {
              acc[friend.id] = friend.name || friend.username;
              return acc;
            }, {}),
        };

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

        const daysInWeek = getDaysInWeek(startDate, endDate);
        const chartData = daysInWeek.map((date) => {
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

  useEffect(() => {
    fetchLogs();
  }, [selectedEvent, user.id, selectedWeek, friends, selectedFriends]);

  const getDaysInWeek = (startDate, endDate) => {
    const days = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return days;
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Opravdu chcete tento event odstranit?")) {
      return;
    }

    try {
      const { error: deleteParticipantsError } = await supabase
        .from("event_participants")
        .delete()
        .eq("event_id", eventId);

      if (deleteParticipantsError) {
        setError("Chyba při odstraňování účastníků eventu: " + deleteParticipantsError.message);
        return;
      }

      const { error: deleteLogsError } = await supabase
        .from("event_logs")
        .delete()
        .eq("event_id", eventId);

      if (deleteLogsError) {
        setError("Chyba při odstraňování logů: " + deleteLogsError.message);
        return;
      }

      const { error: deleteEventError } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (deleteEventError) {
        setError("Chyba při odstraňování eventu: " + deleteEventError.message);
        return;
      }

      setEvents(events.filter((event) => event.id !== eventId));
    } catch (err) {
      setError("Došlo k chybě: " + err.message);
    }
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
            <Button variant="outlined" color="secondary" onClick={() => handleDeleteEvent(event.id)}>
              Odstranit
            </Button>
          </ListItem>
        ))}
      </List>

      {selectedEvent && (
        <>
          <div
            style={{ display: "flex", alignItems: "center", marginBottom: "20px", justifyContent: "center" }}
          >
            <Button onClick={() => changeWeek("previous")}>&#8592;</Button>
            <Typography variant="h6" style={{ margin: "0 20px" }}>
              {`${selectedWeek[0].toLocaleDateString("cs-CZ")} - ${selectedWeek[1].toLocaleDateString("cs-CZ")}`}
            </Typography>
            <Button onClick={() => changeWeek("next")}>&#8594;</Button>
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
                    label={{ value: "Den", position: "insideBottom", offset: -5 }}
                    interval={0}
                    tick={{ angle: 0, textAnchor: "middle" }}
                    height={40}
                  />
                  <YAxis width={10} />
                  <Tooltip />
                  <Legend />
                  {Object.keys(logs.userMap).map((userId) => (
                    <Bar key={userId} dataKey={logs.userMap[userId]} fill={logs.colors[userId]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Typography variant="body2">Žádné záznamy pro tento týden.</Typography>
          )}
        </>
      )}

      <Dialog open={openAddLog} onClose={() => setOpenAddLog(false)}>
        <DialogTitle>Přidat záznam k eventu</DialogTitle>
        <DialogContent>
          <AddLog eventId={selectedEvent} onClose={() => setOpenAddLog(false)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddLog(false)} color="primary">Zavřít</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default EventList;
