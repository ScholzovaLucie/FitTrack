import React, { useState } from 'react';
import { Grid, Button, Typography, Paper, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import AddFriend from './AddFriend';
import CreateEvent from './CreateEvent';
import EventList from './EventList';
import FriendList from './FriendList';  // Importuj komponentu FriendList
import Profile from './Profile';

const MainPage = () => {
  const [openAddFriend, setOpenAddFriend] = useState(false);
  const [openCreateEvent, setOpenCreateEvent] = useState(false);
  const [openFriendList, setOpenFriendList] = useState(false);  // Pro popup seznamu přátel
  const [openProfil, setOpenProfile] = useState(false);

  const handleAddFriendClose = () => setOpenAddFriend(false);
  const handleCreateEventClose = () => setOpenCreateEvent(false);
  const handleFriendListClose = () => setOpenFriendList(false);  // Zavřít seznam přátel
  const handleOpernProfile = () => setOpenProfile(false);

  return (
    <Grid container spacing={3} style={{ padding: '20px' }}>
      <Grid item xs={12}>
        <Typography variant="h4" align="center">FitTrack Dashboard</Typography>
      </Grid>
      <Grid item xs={12}>
        <Grid>
<Button variant="outlined" onClick={() => setOpenProfile(true)} style={{ marginBottom: '16px' }}>
          Profil
        </Button>
        </Grid>
      <Grid>
         <Button variant="outlined" onClick={() => setOpenAddFriend(true)} style={{ marginBottom: '16px' }}>
          Přidat přítele
        </Button>
        <Button variant="outlined" onClick={() => setOpenFriendList(true)} style={{ marginBottom: '16px' }}>
          Zobrazit přátele
        </Button>
      </Grid>
      <Grid>
        <Button variant="outlined" onClick={() => setOpenCreateEvent(true)} style={{ marginBottom: '16px' }}>
          Vytvořit event
        </Button>
      </Grid>
      </Grid>
      <Grid item xs={12}>
          <EventList />
      </Grid>

      {/* Dialog pro přidání přítele */}
      <Dialog open={openProfil} onClose={handleOpernProfile}>
        <DialogTitle>Profil</DialogTitle>
        <DialogContent>
          <Profile />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleOpernProfile} color="primary">Zavřít</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pro přidání přítele */}
      <Dialog open={openAddFriend} onClose={handleAddFriendClose}>
        <DialogTitle>Přidat přítele</DialogTitle>
        <DialogContent>
          <AddFriend />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddFriendClose} color="primary">Zavřít</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pro vytvoření eventu */}
      <Dialog open={openCreateEvent} onClose={handleCreateEventClose}>
        <DialogTitle>Vytvořit nový event</DialogTitle>
        <DialogContent>
          <CreateEvent />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateEventClose} color="primary">Zavřít</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pro zobrazení seznamu přátel */}
      <Dialog open={openFriendList} onClose={handleFriendListClose}>
        <DialogTitle>Seznam přátel</DialogTitle>
        <DialogContent>
          <FriendList />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFriendListClose} color="primary">Zavřít</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default MainPage;
