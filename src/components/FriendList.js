import React, { useEffect, useState } from 'react';
import { List, ListItem, ListItemText, Alert } from '@mui/material';
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

  return (
    <div>
      {error && <Alert severity="error">{error}</Alert>}
      <List>
        {friends.map(friend => (
          <ListItem key={friend.friend_id}>
            <ListItemText primary={friend.username} />
            <ListItemText 
              primary={friend.extern_id} 
              style={{ marginLeft: '16px' }}  // Přidání levého okraje pro mezeru
            />
          </ListItem>
        ))}
      </List>
    </div>
  );
};

export default FriendList;
