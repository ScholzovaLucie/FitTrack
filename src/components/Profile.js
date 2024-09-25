import React, { useState, useEffect } from 'react';
import { TextField, Button, Typography, Alert, CardContent } from '@mui/material';
import supabase from '../supabaseClient';
import { useAuth } from '../AuthContext';

const Profile = () => {
  const { user, setUser } = useAuth();  // Získání aktuálního uživatele
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [externId, setExternId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Načtení aktuálních údajů uživatele při načtení stránky
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('username, email, extern_id')
          .eq('id', user.id)
          .single();

        if (error) {
          setError('Chyba při načítání profilu: ' + error.message);
          return;
        }

        // Nastavení načtených údajů
        setUsername(userProfile.username);
        setEmail(userProfile.email);
        setExternId(userProfile.extern_id);
      } catch (err) {
        setError('Došlo k chybě: ' + err.message);
      }
    };

    fetchProfile();
  }, [user.id]);

  // Uložení změněných údajů
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ username, email })
        .eq('id', user.id);

      if (error) {
        setError('Chyba při aktualizaci profilu: ' + error.message);
        return;
      }

      setMessage('Profil úspěšně aktualizován!');

      // Aktualizace uživatelských dat v kontextu
      setUser((prevUser) => ({
        ...prevUser,
        username,
        email,
      }));
    } catch (err) {
      setError('Došlo k chybě: ' + err.message);
    }
  };

  return (
<div>
   <CardContent>
            <Typography variant="h4">Můj profil</Typography>
            {error && <Alert severity="error">{error}</Alert>}
            {message && <Alert severity="success">{message}</Alert>}
            <form onSubmit={handleUpdateProfile}>
              <TextField
                label="Uživatelské jméno"
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Email"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Extern ID"
                variant="outlined"
                value={externId}
                disabled
                fullWidth
              />
              <Button type="submit" variant="contained" color="primary" style={{ marginTop: '16px' }}>
                Uložit změny
              </Button>
            </form>
          </CardContent>
   
</div>
         
  );
};

export default Profile;
