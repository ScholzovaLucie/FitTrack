import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';
import { Link } from 'react-router-dom'; 
import bcrypt from 'bcryptjs';  // Importujeme bcrypt pro porovnání hesla
import { useAuth } from '../AuthContext';  // Importujeme useAuth
import { TextField, Button, Typography, Alert, Card, CardContent, Grid } from '@mui/material';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { setUser } = useAuth();  // Přidáme funkci na nastavení uživatele

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // Najít uživatele podle uživatelského jména
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, username, password')  // Vybereme id, username a šifrované heslo
        .eq('username', username);

      if (userError || users.length === 0) {
        setError('Špatné uživatelské jméno nebo heslo');
        return;
      }

      const user = users[0];  // Uložíme nalezeného uživatele
      const isPasswordValid = bcrypt.compareSync(password, user.password);  // Ověření hesla

      if (!isPasswordValid) {
        setError('Špatné uživatelské jméno nebo heslo');
        return;
      }

      // Pokud je heslo správné, nastavíme uživatele do kontextu
      setUser(user);

      // Přesměrování na hlavní stránku
      setMessage('Přihlášení úspěšné! Přesměrování...');
      navigate('/mainpage');

    } catch (err) {
      setError('Došlo k chybě: ' + err.message);
    }
  };

 
  return (
    <Grid container justifyContent="center" alignItems="center" style={{ height: '100vh' }}>
      <Grid item xs={12} sm={8} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h4" align="center">Přihlášení</Typography>
            {error && <Alert severity="error">{error}</Alert>}
            {message && <Alert severity="success">{message}</Alert>}
            <form onSubmit={handleLogin}>
              <TextField
                label="Uživatelské jméno"
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                fullWidth
                margin="normal"
              />
              <TextField
                label="Heslo"
                type="password"
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                margin="normal"
              />
              <Button type="submit" variant="contained" color="primary" fullWidth style={{ marginTop: '16px' }}>
                Přihlásit se
              </Button>
              <Link to="/register" color="primary" fullWidth style={{ marginTop: '16px' }}>
                <Button variant="outlined" fullWidth style={{ marginBottom: '16px', marginTop: '16px' }}>Registrace</Button>
                </Link>
            </form>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default Login;
