import React, { useEffect, useState } from 'react';
import { List, ListItem, ListItemText, Alert, Button, CircularProgress,Typography } from '@mui/material';
import supabase from '../supabaseClient';
import { useAuth } from '../AuthContext';

const FriendList = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [error, setError] = useState('');

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
  }, [user.id]);

  const handleRemoveFriend = async (friendId) => {
    setError('');
    try {
      const { data, error } = await supabase
        .from('friends')
        .delete()
        .match({ user_id: user.id, friend_id: friendId });
  
      if (error) {
        setError('Chyba při odstraňování přítele: ' + error.message);
      } else {
        // Aktualizujte seznam přátel po úspěšném odstranění
        setFriends((prevFriends) => prevFriends.filter((friend) => friend.id !== friendId));
      }

      const {data2, error2} = await supabase
        .from('friends')
        .delete()
        .match({ friend_id: user.id, user_id: friendId });
    } catch (err) {
      setError('Došlo k chybě: ' + err.message);
    } 
  };
  

  return (
    <div>
      {error && <Alert severity="error">{error}</Alert>}
      {friends.length > 0 ? (
        <List>
          {friends.map((friend) => (
            <ListItem key={friend.id} divider>
              <ListItemText primary={friend.name || friend.username} />
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => handleRemoveFriend(friend.id)}
              >
                Odstranit
              </Button>
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography>Nemáte žádné přátele.</Typography>
      )}
    </div>
  );
};

export default FriendList;
