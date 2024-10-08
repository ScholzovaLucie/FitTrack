import React, { useEffect, useState, forwardRef, useImperativeHandle } from "react";
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
import EventTimer from "./EventTimer";
import UserLogsDialog from "./UserLogsDialog"; 

const EventList = forwardRef(({ runningEventId, setRunningEventId }, ref) => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [logs, setLogs] = useState({ data: [], colors: {}, userMap: {} });
  const [userLogs, setUserLogs] = useState([]); // Přidáno pro seznam logů uživatele
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedEventName, setSelectedEventName] = useState("");
  const [error, setError] = useState("");
  const [openAddLog, setOpenAddLog] = useState(false);
  const [openUserLogsDialog, setOpenUserLogsDialog] = useState(false); // Stav pro otevření dialogu
  const [friends, setFriends] = useState([]);

  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());
  const [selectedFriends, setSelectedFriends] = useState([]);

  const hasEvents = events.length > 0;

  const handleFriendSelection = (friendId) => {
      const handleDeleteLog = async (logId) => {
    if (window.confirm("Opravdu chcete tento záznam odstranit?")) {
      try {
        const { error } = await supabase
          .from("event_logs")
          .delete()
          .eq("id", logId);
        if (error) {
          setError("Chyba při odstraňování záznamu: " + error.message);
        } else {
          fetchLogs(); // Aktualizovat seznam logů po odstranění
        }
      } catch (err) {
        setError("Došlo k chybě: " + err.message);
      }
    }
  };
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

  const handleTimerStop = () => {
    fetchLogs();
  };

  function getCurrentWeek() {
    const today = new Date();
    const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1)); // Pondělí
    const lastDayOfWeek = new Date(today.setDate(firstDayOfWeek.getDate() + 6)); // Neděle
    return [firstDayOfWeek, lastDayOfWeek];
  }

  const resetWeek = () => {
    setSelectedWeek(getCurrentWeek());
  };

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
    useEffect(() => {
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

        // Filtrovat logy pro aktuálního uživatele
        const userLogs = allLogs.filter((log) => log.user_id === user.id);

        // Uložit logy uživatele do stavu
        setUserLogs(userLogs);

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
    fetchEvents();
  }, [selectedEvent, user.id, selectedWeek, friends, selectedFriends, userLogs]);

  useImperativeHandle(ref, () => ({
    fetchEvents,
  }));

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

  const handleDeleteLog = async (logId) => {
    if (window.confirm("Opravdu chcete tento záznam odstranit?")) {
      try {
        const { error } = await supabase
          .from("event_logs")
          .delete()
          .eq("id", logId);
        if (error) {
          setError("Chyba při odstraňování záznamu: " + error.message);
        } else {
          fetchLogs(); // Aktualizovat seznam logů po odstranění
        }
      } catch (err) {
        setError("Došlo k chybě: " + err.message);
      }
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
              setSelectedEventName(event.event_name)
            }}
          >
            <ListItemText primary={event.event_name} />
            <Button
              variant="outlined"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedEvent(event.id);
                setSelectedEventName(event.event_name)
                setOpenAddLog(true); // Otevři popup pro přidání logu
              }}
            >
              Přidat log
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteEvent(event.id);
              }}
            >
              Odstranit
            </Button>
          </ListItem>
        ))}
      </List>

      {hasEvents && selectedEvent && (
        <>
          {/* Zobrazit časovač pro vybraný event */}
          <EventTimer
            eventId={selectedEvent}
            runningEventId={runningEventId}
            setRunningEventId={setRunningEventId}
            eventName={selectedEventName}
            onTimerStop={handleTimerStop}
          />

          {/* Ovládací prvky pro přepínání týdnů */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column"
            }}
          >
            <div style={{  
              display: "flex", 
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row"}}>
                <Button onClick={() => changeWeek("previous")}>&#8592;</Button>
            <Typography variant="h6" style={{ margin: "0 20px" }}>
              {`${selectedWeek[0].toLocaleDateString(
                "cs-CZ"
              )} - ${selectedWeek[1].toLocaleDateString("cs-CZ")}`}
            </Typography>
            <Button onClick={() => changeWeek("next")}>&#8594;</Button>
            </div>
          
             {/* Přidáváme nové tlačítko pro návrat k aktuálnímu týdnu */}
             <Button
              variant="outlined"
              color="primary"
              onClick={resetWeek}
              style={{ marginLeft: "20px" }}
            >
              Dnešní týden
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
                    !selectedFriends.includes(friend.id) &&
                    selectedFriends.length >= 5
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
            <Typography variant="body2">
              Žádné záznamy pro tento týden.
            </Typography>
          )}

       {/* Tlačítko pro otevření dialogu se seznamem logů */}
       <div style={{ marginTop: "20px", textAlign: "center" }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setOpenUserLogsDialog(true)}
            >
              Zobrazit moje záznamy
            </Button>
          </div>

          {/* Dialog se seznamem logů uživatele */}
          <UserLogsDialog
            open={openUserLogsDialog}
            onClose={() => setOpenUserLogsDialog(false)}
            userLogs={userLogs}
            handleDeleteLog={handleDeleteLog} // Volitelné
          />
        </>
      )}

      {/* Dialog pro přidání záznamu */}
      <Dialog open={openAddLog} onClose={() => setOpenAddLog(false)}>
        <DialogTitle>Přidat záznam k eventu</DialogTitle>
        <DialogContent>
          <AddLog eventId={selectedEvent} onClose={() => setOpenAddLog(false)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenAddLog(false);
            fetchLogs();
          } } color="primary">
            Zavřít
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
});

export default EventList;
