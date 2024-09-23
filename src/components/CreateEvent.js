import React, { useState, useEffect } from 'react';
import supabase from '../supabaseClient';
import { useAuth } from '../AuthContext';
import { TextField, Button, Select, MenuItem, FormControl, InputLabel, Typography, Alert } from '@mui/material';


const CreateEvent = () => {
  const { user } = useAuth();  // Získání aktuálního uživatele
  const [eventName, setEventName] = useState('');
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Ověříme, že uživatel je načten
  useEffect(() => {
    if (user) {
        const fetchFriends = async () => {
            try {
              const { data: userFriends, error } = await supabase
                .from('friends')
                .select('friend_id, users!friends_friend_id_fkey(username, extern_id)')  // Explicitně specifikujeme vztah
                .eq('user_id', user.id);
          
              if (error) {
                setError('Chyba při načítání přátel: ' + error.message);
                return;
              }
          
              setFriends(userFriends);
            } catch (err) {
              setError('Došlo k chybě: ' + err.message);
            }
          };
      fetchFriends();
    }
  }, [user]);

  // Zajistíme, že komponenta nebude vykreslena, pokud uživatel není přihlášen
  if (!user) {
    return <p>Načítám údaje uživatele...</p>;
  }


  // Vytvořit nový event
  const handleCreateEvent = async (e) => {
    e.preventDefault(); 
    const participants = selectedFriend ? [selectedFriend] : []; 
  
    try {
      // Vytvoření nového eventu
      const {data: eventData, error: eventError } = await supabase
      .from('events')
      .insert([{ event_name: eventName, created_by: user.id }]).select().single();

      console.log('event_name:', eventData);
      
      if (eventError) {
        console.error('Chyba při přidávání eventu:', eventError);
        setError('Chyba při vytváření eventu: ' + eventError.message);
        return;
      }
  
      // Přidání účastníků do event_participants
      const participantEntries = participants.map(participantId => ({
        event_id: eventData.id, // Zajištění, že event_id je správně nastavena
        user_id: participantId,
      }));
      console.log('participantEntries:', participantEntries);
  
      if (participantEntries.length > 0) {
        const { error: participantsError } = await supabase
          .from('event_participants')
          .insert(participantEntries);
  
        if (participantsError) {
          console.error('Chyba při přidávání účastníků:', participantsError.message);
          setError('Chyba při přidávání účastníků: ' + participantsError.message);
          return;
        }
      }
  
      setMessage('Event úspěšně vytvořen!');
      setEventName(''); // Resetuj pole pro název eventu
      setSelectedFriend(null); // Resetuj vybraného přítele
    } catch (err) {
      setError('Došlo k chybě: ' + err.message);
    }
  };

  return (
    <div>
      <Typography variant="h4">Vytvořit nový event</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {message && <Alert severity="success">{message}</Alert>}
      <form onSubmit={handleCreateEvent}>
        <TextField
          label="Název eventu"
          variant="outlined"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          required
          fullWidth
        />

        <FormControl fullWidth variant="outlined" margin="normal">
          <InputLabel>Vybrat přítele</InputLabel>
          <Select
            value={selectedFriend}
            onChange={(e) => setSelectedFriend(e.target.value)}
            label="Vybrat přítele"
          >
            <MenuItem value="">
              <em>Bez přítele</em>
            </MenuItem>
            {friends.map((friend) => (
              <MenuItem key={friend.friend_id} value={friend.friend_id}>
                {friend.users.username}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button type="submit" variant="contained" color="primary">
          Vytvořit event
        </Button>
      </form>
    </div>
  );
};

export default CreateEvent;
