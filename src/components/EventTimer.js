import React, { useEffect, useState, useRef } from "react";
import { Button, Typography, Paper, Snackbar, Alert } from "@mui/material";
import supabase from "../supabaseClient";
import { useAuth } from "../AuthContext";

// Funkce pro uložení času do localStorage
const saveTimerState = (eventId, startTime) => {
  localStorage.setItem(`timer_${eventId}`, JSON.stringify({ startTime }));
};

// Funkce pro načtení času z localStorage
const loadTimerState = (eventId) => {
  const savedTimer = localStorage.getItem(`timer_${eventId}`);
  return savedTimer ? JSON.parse(savedTimer) : null;
};

// Funkce pro odstranění času z localStorage
const clearTimerState = (eventId) => {
  localStorage.removeItem(`timer_${eventId}`);
};

// Funkce pro rozdělení času, pokud běžel přes více dní
const splitTimeAcrossDays = (startTime, endTime) => {
    const logs = [];
    let currentDate = new Date(startTime);
    const endDate = new Date(endTime);
  
    while (currentDate.toDateString() !== endDate.toDateString()) {
      const nextDay = new Date(currentDate);
      nextDay.setHours(23, 59, 59, 999);
  
      const durationInMinutes = (nextDay - currentDate) / 1000 / 60;
      logs.push({
        log_date: currentDate.toISOString().split("T")[0],
        duration: Math.round(durationInMinutes), // Zaokrouhlení na nejbližší celé číslo
      });
  
      currentDate = new Date(nextDay);
      currentDate.setHours(0, 0, 0, 0);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  
    // Přidat čas pro poslední den
    const durationInMinutes = (endDate - currentDate) / 1000 / 60;
    logs.push({
      log_date: endDate.toISOString().split("T")[0],
      duration: Math.round(durationInMinutes), // Zaokrouhlení na nejbližší celé číslo
    });
  
    return logs;
  };

const EventTimer = ({ eventId, runningEventId, setRunningEventId, eventName, onTimerStop }) => {
  const { user } = useAuth();
  const [running, setRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // Čas v sekundách
  const [snackbarOpen, setSnackbarOpen] = useState(false); // Pro oznámení
  const [errorSnackbarOpen, setErrorSnackbarOpen] = useState(false); // Pro chybu
  const startTimeRef = useRef(null);

  useEffect(() => {
    const savedTimer = loadTimerState(eventId);
    if (savedTimer) {
      const currentTime = Date.now();
      const timeElapsed = (currentTime - new Date(savedTimer.startTime).getTime()) / 1000;
      setElapsedTime(timeElapsed);
      startTimeRef.current = new Date(savedTimer.startTime);
      setRunning(true);
      setRunningEventId(eventId);
    }
  }, [eventId, setRunningEventId]);

  useEffect(() => {
    let interval = null;
    if (running) {
      interval = setInterval(() => {
        const currentTime = Date.now();
        const timeElapsed = (currentTime - startTimeRef.current.getTime()) / 1000;
        setElapsedTime(timeElapsed);
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [running]);

  const handleStart = () => {
    if (runningEventId && runningEventId !== eventId) {
      setErrorSnackbarOpen(true);
      return;
    }
    const startTime = new Date();
    startTimeRef.current = startTime;
    saveTimerState(eventId, startTime); // Uložit čas do localStorage
    setRunning(true);
    setRunningEventId(eventId); // Nastavit aktuální běžící event
  };

  const handleStop = async () => {
    setRunning(false);
    setRunningEventId(null); // Časovač zastaven, žádný běžící event
    const endTime = new Date();
    const logs = splitTimeAcrossDays(startTimeRef.current, endTime);

    try {
      for (const log of logs) {
        const { error } = await supabase
          .from("event_logs")
          .insert({
            event_id: eventId,
            user_id: user.id,
            log_date: log.log_date,
            duration: log.duration,
          });

        if (error) {
          console.error("Chyba při ukládání logu: ", error.message);
        }
      }
      setElapsedTime(0);
      clearTimerState(eventId); // Vymazat stav z localStorage
      setSnackbarOpen(true); // Zobrazit oznámení o úspěchu
      onTimerStop();
    } catch (error) {
      console.error("Došlo k chybě při ukládání logu: ", error);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const handleSnackbarClose = () => setSnackbarOpen(false);
  const handleErrorSnackbarClose = () => setErrorSnackbarOpen(false);

  return (
    <Paper style={{ padding: "20px", textAlign: "center" }}>
      <Typography variant="h6">Časovač pro event {eventName}</Typography>
      <Typography variant="h4">{formatTime(elapsedTime)}</Typography>
      {!running ? (
        <Button variant="contained" color="primary" onClick={handleStart}>
          Spustit časovač
        </Button>
      ) : (
        <Button variant="contained" color="secondary" onClick={handleStop}>
          Zastavit časovač
        </Button>
      )}

      {/* Oznámení o úspěchu */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity="success">
          Čas byl úspěšně zaznamenán!
        </Alert>
      </Snackbar>

      {/* Oznámení o chybě */}
      <Snackbar open={errorSnackbarOpen} autoHideDuration={6000} onClose={handleErrorSnackbarClose}>
        <Alert onClose={handleErrorSnackbarClose} severity="error">
          Již máte spuštěný časovač pro jiný event.
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default EventTimer;
