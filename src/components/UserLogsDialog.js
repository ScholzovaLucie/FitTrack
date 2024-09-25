import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Typography,
  Button,
} from '@mui/material';

const UserLogsDialog = ({ open, onClose, userLogs, handleDeleteLog }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Moje záznamy</DialogTitle>
      <DialogContent dividers>
        {userLogs.length > 0 ? (
          <List>
            {userLogs.map((log) => (
              <ListItem key={log.id}>
                <ListItemText
                  primary={`Datum: ${new Date(log.log_date).toLocaleDateString('cs-CZ')}`}
                  secondary={`Trvání: ${log.duration} minut`}
                />
                {/* Volitelně můžete přidat tlačítka pro úpravu nebo odstranění logu */}
                <Button
                  variant="text"
                  color="secondary"
                  onClick={() => handleDeleteLog(log.id)}
                >
                  Odstranit
                </Button>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2">Nemáte žádné záznamy pro tento týden.</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Zavřít
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserLogsDialog;
