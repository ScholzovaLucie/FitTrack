import React, { useState } from 'react';
import { TextField, Button, Typography } from '@mui/material';
import supabase from '../supabaseClient';

const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleUpdatePassword = async () => {
    setError('');
    setMessage('');
    if (password !== passwordConfirm) {
      setError('Hesla se neshodují.');
      return;
    }
    try {
      const { error } = await supabase.auth.update({ password });
      if (error) {
        setError('Chyba při aktualizaci hesla: ' + error.message);
      } else {
        setMessage('Heslo bylo úspěšně aktualizováno.');
      }
    } catch (err) {
      setError('Došlo k chybě: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h5">Nastavení nového hesla</Typography>
      <TextField
        label="Nové heslo"
        type="password"
        fullWidth
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ marginTop: '16px' }}
      />
      <TextField
        label="Potvrzení nového hesla"
        type="password"
        fullWidth
        value={passwordConfirm}
        onChange={(e) => setPasswordConfirm(e.target.value)}
        style={{ marginTop: '16px' }}
      />
      {message && <Typography color="primary">{message}</Typography>}
      {error && <Typography color="error">{error}</Typography>}
      <Button
        variant="contained"
        color="primary"
        onClick={handleUpdatePassword}
        style={{ marginTop: '16px' }}
      >
        Aktualizovat heslo
      </Button>
    </div>
  );
};

export default UpdatePassword;
