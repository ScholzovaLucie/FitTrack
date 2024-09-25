import React, { useState } from 'react';
import {
  Grid,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  AppBar,
  Toolbar,
} from '@mui/material';
import AddFriend from './AddFriend';
import CreateEvent from './CreateEvent';
import EventList from './EventList';
import FriendList from './FriendList';
import Profile from './Profile';
import { useAuth } from '../AuthContext'; // Importujte váš kontext pro autentizaci

const MainPage = () => {
  const [openAddFriend, setOpenAddFriend] = useState(false);
  const [openCreateEvent, setOpenCreateEvent] = useState(false);
  const [openFriendList, setOpenFriendList] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const { setUser } = useAuth(); 


  const handleAddFriendClose = () => setOpenAddFriend(false);
  const handleCreateEventClose = () => setOpenCreateEvent(false);
  const handleFriendListClose = () => setOpenFriendList(false);
  const handleProfileClose = () => setOpenProfile(false);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" style={{ flexGrow: 1 }}>
              FitTrack Dashboard
            </Typography>
            <Button color="inherit" onClick={() => setOpenProfile(true)}>
              Profil
            </Button>
            <Button color="inherit" onClick={ () => setUser(null)}>
              Odhlásit se
            </Button>
          </Toolbar>
        </AppBar>
      </Grid>
      <Grid item xs={12} style={{ padding: '20px' }}>
        <Grid container spacing={2}>
          <Grid item>
            <Button
              variant="outlined"
              onClick={() => setOpenAddFriend(true)}
              style={{ marginBottom: '16px' }}
            >
              Přidat přítele
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              onClick={() => setOpenFriendList(true)}
              style={{ marginBottom: '16px' }}
            >
              Zobrazit přátele
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              onClick={() => setOpenCreateEvent(true)}
              style={{ marginBottom: '16px' }}
            >
              Vytvořit event
            </Button>
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <EventList />
      </Grid>

      {/* Dialog pro profil */}
      <Dialog open={openProfile} onClose={handleProfileClose}>
        <DialogTitle>Profil</DialogTitle>
        <DialogContent>
          <Profile />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleProfileClose} color="primary">
            Zavřít
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pro přidání přítele */}
      <Dialog open={openAddFriend} onClose={handleAddFriendClose}>
        <DialogTitle>Přidat přítele</DialogTitle>
        <DialogContent>
          <AddFriend />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddFriendClose} color="primary">
            Zavřít
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pro vytvoření eventu */}
      <Dialog open={openCreateEvent} onClose={handleCreateEventClose}>
        <DialogTitle>Vytvořit nový event</DialogTitle>
        <DialogContent>
          <CreateEvent />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateEventClose} color="primary">
            Zavřít
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pro zobrazení seznamu přátel */}
      <Dialog open={openFriendList} onClose={handleFriendListClose}>
        <DialogTitle>Seznam přátel</DialogTitle>
        <DialogContent>
          <FriendList />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFriendListClose} color="primary">
            Zavřít
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default MainPage;
