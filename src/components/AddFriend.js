import React, { useState } from 'react';
import { TextField, Button, Alert } from '@mui/material';
import supabase from '../supabaseClient';
import { useAuth } from '../AuthContext';

const AddFriend = () => {
  const { user } = useAuth();
  const [externId, setExternId] = useState('');
  const [friendId, setFriendId] = useState(null);  // ID přítele
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSearchFriend = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('extern_id', externId)
        .single();  // Hledání uživatele podle extern_id

      if (fetchError) {
        setError('Chyba při hledání uživatele: ' + fetchError.message);
        return;
      }

      if (!data) {
        setError('Uživatel s tímto extern ID nebyl nalezen.');
        return;
      }

      setFriendId(data.id);  // Nastavit ID přítele
      setError('');  // Vyčistit případnou chybu
      setMessage('Uživatel nalezen, můžete přidat jako přítele!');  // Informace o úspěšném nalezení
    } catch (err) {
      setError('Došlo k chybě: ' + err.message);
    }
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!friendId) {
      setError('Nejdříve musíte vyhledat uživatele.');
      return;
    }
    
    try {
      // Přidání přítele
      const { error: addError } = await supabase
        .from('friends')
        .insert([{ user_id: user.id, friend_id: friendId }]);

      if (addError) {
        setError('Chyba při přidávání přítele: ' + addError.message);
        return;
      }

      // Přidání uživatele do přátelství opačně
      const { error: reverseError } = await supabase
        .from('friends')
        .insert([{ user_id: friendId, friend_id: user.id }]);

      if (reverseError) {
        setError('Chyba při přidávání uživatele do přátelství: ' + reverseError.message);
        return;
      }

      setMessage('Přítel úspěšně přidán!');
      setExternId('');
      setFriendId(null);  // Resetovat ID přítele
    } catch (err) {
      setError('Došlo k chybě: ' + err.message);
    }
  };

  return (
    <div>
      {error && <Alert severity="error">{error}</Alert>}
      {message && <Alert severity="success">{message}</Alert>}
      <TextField
        label="Extern ID přítele"
        variant="outlined"
        value={externId}
        onChange={(e) => setExternId(e.target.value)}
        required
        fullWidth
      />
      <Button onClick={handleSearchFriend} variant="contained" color="primary" style={{ marginTop: '16px' }}>
        Vyhledat přítele
      </Button>
      <Button onClick={handleAddFriend} variant="contained" color="primary" style={{ marginTop: '16px' }}>
        Přidat přítele
      </Button>
    </div>
  );
};

export default AddFriend;
