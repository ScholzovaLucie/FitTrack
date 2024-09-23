import React, { useState } from 'react';
import { TextField, Button, Alert } from '@mui/material';
import supabase from '../supabaseClient';
import { useAuth } from '../AuthContext';

const AddLog = ({ eventId, onClose }) => {
  const { user } = useAuth();
  const [duration, setDuration] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10)); // Default na dnešní datum
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleAddLog = async (e) => {
    e.preventDefault();
    try {
      const { error: logError } = await supabase
        .from('event_logs')
        .insert([{ event_id: eventId, user_id: user.id, duration: parseInt(duration), log_date: logDate }]);

      if (logError) {
        setError('Chyba při přidávání záznamu: ' + logError.message);
        return;
      }

      setMessage('Záznam úspěšně přidán!');
      setDuration('');
      setLogDate(new Date().toISOString().slice(0, 10)); // Resetovat datum na dnešní
      onClose(); // Zavřít dialog
    } catch (err) {
      setError('Došlo k chybě: ' + err.message);
    }
  };

  return (
    <div>
      {error && <Alert severity="error">{error}</Alert>}
      {message && <Alert severity="success">{message}</Alert>}
      <form onSubmit={handleAddLog}>
        <TextField
          label="Počet minut"
          variant="outlined"
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          required
          fullWidth
        />
        <TextField
          label="Datum logu"
          variant="outlined"
          type="date"
          value={logDate}
          onChange={(e) => setLogDate(e.target.value)}
          required
          fullWidth
          InputLabelProps={{
            shrink: true,
          }}
        />
        <Button type="submit" variant="contained" color="primary" style={{ marginTop: '16px' }}>
          Přidat záznam
        </Button>
      </form>
    </div>
  );
};

export default AddLog;
