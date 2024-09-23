import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { v4 as uuid } from "uuid";
import bcrypt from "bcryptjs";
import { Link } from "react-router-dom";
import {
  TextField,
  Button,
  Typography,
  Alert,
  Card,
  CardContent,
  Grid,
} from "@mui/material";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      // Zkontrolovat, zda uživatelské jméno není již použito
      const { data: existingUsers, error: checkError } = await supabase
        .from("users")
        .select("username")
        .eq("username", username);

      if (checkError) {
        setError(
          "Chyba při kontrole uživatelského jména: " + checkError.message
        );
        return;
      }

      if (existingUsers.length > 0) {
        setError("Uživatelské jméno je již použito");
        return;
      }

      // Vytvořit nového uživatele
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      const extern_id = uuid();
      const { error: dbError } = await supabase
        .from("users")
        .insert([{ username, password: hashedPassword, extern_id }]);

      if (dbError) {
        setError("Chyba při vytváření uživatele: " + dbError.message);
        return;
      }

      setMessage("Registrace úspěšná! Přihlášení...");
      navigate("/login");
    } catch (err) {
      setError("Došlo k chybě: " + err.message);
    }
  };

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      style={{ height: "100vh" }}
    >
      <Grid item xs={12} sm={8} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h4" align="center">Registrace</Typography>
            {error && <Alert severity="error">{error}</Alert>}
            {message && <Alert severity="success">{message}</Alert>}
            <form onSubmit={handleRegister}>
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
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                style={{ marginTop: "16px" }}
              >
                Registrace
              </Button>
              <Link to="/login" color="primary" fullWidth style={{ marginTop: '16px' }}>
                <Button variant="outlined"  fullWidth style={{ marginBottom: '16px', marginTop: '16px' }}>
                  Login
                </Button>
              </Link>
            </form>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default Register;
