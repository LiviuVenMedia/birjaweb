
import React, { useCallback, useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Paper,
  Card,
  CardContent,
  CardActions,
  AppBar,
  Toolbar,
  IconButton,
  Menu as MuiMenu,
  CssBaseline,
} from '@mui/material';
import { ThemeProvider, createTheme, alpha } from '@mui/material/styles';

interface ApplicationItem {
  id: number;
  offerId?: number;
  name: string;
  phone: string;
  region: string;
  interest: string;
  applicantId?: string;
  offer?: { title: string };
  status?: string;
  Contract?: string;
  Age?: number;
  Experience?: string;
  SalaryWorker?: string;
  images?: string | null;
}

type Role = 'EMPLOYER';

interface User {
  id: string;
  username: string;
  role: Role;
  token: string;
}

interface Vacancy {
  id: number;
  ownerId: string;
  title: string;
  region: string;
  salary: string;
  text: string;
  images?: string | null;
}

const API_BASE = '/api';

// Premium/Luxe theme similar to birja.md aesthetics
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#C8A15A' }, // gold accent
    secondary: { main: '#8B6E3B' },
    background: { default: '#0B0F14', paper: '#0F1620' },
    text: { primary: '#E6E8EC', secondary: '#A7B0BF' },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
    h3: { fontWeight: 800, letterSpacing: '0.6px' },
    h5: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.85)} 0%, ${alpha(theme.palette.background.paper, 0.65)} 100%)`,
          border: `1px solid ${alpha('#C8A15A', 0.12)}`,
          boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha('#0C131C', 0.8)} 100%)`,
          border: `1px solid ${alpha('#C8A15A', 0.14)}`,
          boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          paddingLeft: 18,
          paddingRight: 18,
          paddingTop: 10,
          paddingBottom: 10,
          boxShadow: '0 8px 20px rgba(200,161,90,0.25)',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #C8A15A 0%, #9F7C3C 100%)',
          color: '#0B0F14',
          '&:hover': {
            background: 'linear-gradient(135deg, #D4B26D 0%, #B18945 100%)',
            boxShadow: '0 12px 24px rgba(200,161,90,0.35)'
          },
        },
        outlined: {
          borderColor: alpha('#C8A15A', 0.35),
          color: '#E6E8EC',
          '&:hover': { borderColor: '#C8A15A', backgroundColor: alpha('#C8A15A', 0.08) },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: { borderColor: alpha('#C8A15A', 0.18) },
        root: {
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#C8A15A', 0.35) },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#C8A15A' },
          backgroundColor: alpha('#101823', 0.6),
        },
        input: { color: '#E6E8EC' },
      },
    },
    MuiSelect: {
      styleOverrides: { outlined: { backgroundColor: alpha('#101823', 0.6) } },
    },
  },
});

function useLocalStorageState<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState];
}

const escapeHtml = (str: unknown): string =>
  String(str).replace(/[&<>"']/g, (s) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s as string] as string));

export default function App() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useLocalStorageState<User | null>('birjatg_currentUser', null);
  const [vacancies, setVacancies] = useLocalStorageState<Vacancy[]>('birjatg_offers', []);
  const [, setApplications] = useLocalStorageState<ApplicationItem[]>('birjatg_applications', []);
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [presetInterest, setPresetInterest] = useState<string>('');
  const token = currentUser?.token ?? '';
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(menuAnchorEl);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    navigate('/');
  }, [setCurrentUser, navigate]);

  useEffect(() => {
    if (vacancies.length === 0) {
      setVacancies([
        { id: 1, ownerId: 'demoEmployer', title: 'Șofer categoria B', region: 'Chișinău', salary: '10000 MDL', text: 'Livrări locale, program flexibil.' },
        { id: 2, ownerId: 'demoEmployer', title: 'Operator call-center', region: 'Bălți', salary: '8000 MDL', text: 'Program 9-18, limba română și rusă.' },
        { id: 3, ownerId: 'otherCo', title: 'Programator Frontend', region: 'Remote / Moldova', salary: '1200 EUR', text: 'React, TypeScript, full remote.' },
      ]);
    }
  }, [setVacancies]);

  const fetchVacancies = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE}/vacancies`);
      const data = await resp.json();
      setVacancies(data);
    } catch {}
  }, [setVacancies]);

  const fetchMyVacancies = useCallback(async () => {
    if (!currentUser) return [];
    try {
      const resp = await fetch(`${API_BASE}/employer/vacancies`, { headers: { Authorization: `Bearer ${token}` } });
      return await resp.json();
    } catch {
      return [];
    }
  }, [currentUser, token]);

  useEffect(() => {
    fetchVacancies();
  }, [fetchVacancies]);

  const [myVacancies, setMyVacancies] = useState<Vacancy[]>([]);
  useEffect(() => {
    if (currentUser) {
      fetchMyVacancies().then(setMyVacancies);
    }
  }, [currentUser, fetchMyVacancies]);

  const [candidates, setCandidates] = useState<ApplicationItem[]>([]);
  const loadCandidates = useCallback(async () => {
    if (!currentUser) {
      setCandidates([]);
      return;
    }
    try {
      const resp = await fetch(`${API_BASE}/employer/candidates`, { headers: { Authorization: `Bearer ${token}` } });
      const items = await resp.json();
      setCandidates(items);
    } catch {
      setCandidates([]);
    }
  }, [currentUser, token]);
  useEffect(() => {
    if (currentUser) loadCandidates();
  }, [currentUser, loadCandidates]);

  const onRegister = useCallback(async (username: string, password: string) => {
    if (!username || !password) return 'Completați utilizator și parolă';
    try {
      const resp = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) return data.error ?? 'Eroare la înregistrare';
      return 'Cont creat. Vă rugăm să vă autentificați.';
    } catch {
      return 'Eroare la înregistrare';
    }
  }, []);

  const onLogin = useCallback(
    async (username: string, password: string, role: Role) => {
      if (!username || !password) return 'Completați utilizator și parolă';
      try {
        const resp = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, role }),
        });
        const data = await resp.json();
        if (!resp.ok) return data.error ?? 'Login eșuat';
        const user: User = { ...data.user, token: data.token };
        setCurrentUser(user);
        navigate(user.role === 'EMPLOYER' ? '/myposts' : '/');
        return null;
      } catch {
        return 'Eroare la login';
      }
    },
    [setCurrentUser, navigate]
  );

  const createVacancy = useCallback(
    async (payload: Pick<Vacancy, 'title' | 'text' | 'region' | 'salary'>) => {
      try {
        const resp = await fetch(`${API_BASE}/employer/vacancies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const itm = await resp.json();
        if (!resp.ok) throw new Error(itm.error || 'Eroare creare');
        navigate('/login');
        fetchMyVacancies().then(setMyVacancies);
        fetchVacancies();
      } catch (e: any) {
        alert(e.message || 'Eroare rețea');
      }
    },
    [token, fetchMyVacancies, fetchVacancies, navigate]
  );

  const updateVacancy = useCallback(
    async (id: number, payload: Vacancy) => {
      try {
        const resp = await fetch(`${API_BASE}/employer/vacancies/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        if (!resp.ok) {
          const d = await resp.json();
          throw new Error(d.error || 'Eroare actualizare');
        }
        fetchMyVacancies().then(setMyVacancies);
        fetchVacancies();
        loadCandidates();
      } catch (e: any) {
        alert(e.message || 'Eroare rețea');
      }
    },
    [token, fetchMyVacancies, fetchVacancies, loadCandidates]
  );

  const deleteVacancy = useCallback(
    async (id: number) => {
      try {
        const resp = await fetch(`${API_BASE}/employer/vacancies/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) {
          const d = await resp.json();
          throw new Error(d.error || 'Eroare ștergere');
        }
        fetchMyVacancies().then(setMyVacancies);
        fetchVacancies();
        loadCandidates();
      } catch (e: any) {
        alert(e.message || 'Eroare rețea');
      }
    },
    [token, fetchMyVacancies, fetchVacancies, loadCandidates]
  );

  const applyForJob = useCallback(
    async (payload: Omit<ApplicationItem, 'id'>) => {
      try {
        const resp = await fetch(`${API_BASE}/applications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const d = await resp.json();
        if (!resp.ok) throw new Error(d.error || 'Eroare aplicare');
        setApplications((prev) => prev);
        if (currentUser?.role === 'EMPLOYER') fetchMyVacancies().then(setMyVacancies);
        return true;
      } catch (e: any) {
        alert(e.message || 'Eroare rețea');
        return false;
      }
    },
    [currentUser, setApplications, fetchMyVacancies]
  );

  const updateCandidate = useCallback(
    async (id: number, payload: Partial<ApplicationItem>) => {
      try {
        const resp = await fetch(`${API_BASE}/applications/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        if (!resp.ok) {
          const d = await resp.json().catch(() => ({}));
          throw new Error(d.error || 'Eroare actualizare candidat');
        }
        await loadCandidates();
      } catch (e: any) {
        alert(e.message || 'Eroare rețea');
      }
    },
    [token, loadCandidates]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container
        maxWidth="lg"
        className="py-8"
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: 'radial-gradient(1200px 600px at 20% -10%, rgba(200,161,90,0.10) 0%, rgba(0,0,0,0) 60%), radial-gradient(1000px 500px at 100% 10%, rgba(0,153,255,0.08) 0%, rgba(0,0,0,0) 55%)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          pb: 8,
          pt: 6,
        }}
      >
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={4} sx={{ width: '100%' }}>
        {currentUser && (
          <AppBar
            position="static"
            color="transparent"
            elevation={0}
            sx={{
              width: '100%',
              backdropFilter: 'saturate(180%) blur(8px)',
              backgroundColor: alpha(theme.palette.background.paper, 0.5),
              borderBottom: `1px solid ${alpha('#C8A15A', 0.12)}`,
            }}
          >
            <Toolbar sx={{ justifyContent: 'flex-end' }}>
              <IconButton edge="end" aria-label="menu" onClick={(e) => setMenuAnchorEl(e.currentTarget)}>
                <span style={{ fontSize: 22, lineHeight: 1 }} aria-hidden>
                  ☰
                </span>
              </IconButton>
              <MuiMenu
                anchorEl={menuAnchorEl}
                open={isMenuOpen}
                onClose={() => setMenuAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem component={Link} to="/myposts" onClick={() => setMenuAnchorEl(null)}>
                  My Posts
                </MenuItem>
                <MenuItem component={Link} to="/candidatslist" onClick={() => setMenuAnchorEl(null)}>
                  Candidats List
                </MenuItem>
                <MenuItem component={Link} to="/allposts" onClick={() => setMenuAnchorEl(null)}>
                  All Posts
                </MenuItem>
              </MuiMenu>
            </Toolbar>
          </AppBar>
        )}
        <Box component="header" className="mb-8 text-center home-container">
          <Typography variant="h3" className="font-bold home-title" sx={{ color: 'primary.main' }}>
            Birja Work
          </Typography>
          <Typography variant="subtitle1" className="text-gray-600 home-subtitle" sx={{ color: 'text.secondary' }}>
            Posturi vacante disponibile
          </Typography>
          <Box className="mt-2">
            {currentUser ? (
              <Button onClick={handleLogout} variant="contained" color="primary" className="home-button">
                Log out
              </Button>
            ) : (
              <Button component={Link} to="/login" variant="contained" color="primary" className="home-button">
                Login Angajatori
              </Button>
            )}
          </Box>
        </Box>
        <Routes>
        <Route
          path="/"
          element={
            <Paper elevation={3} className="p-6" aria-live="polite" sx={{ maxWidth: { xs: '100%', sm: 720, md: 900 }, width: '100%', mb: 4, mx: 'auto' }} >
              <Typography variant="h5" className="mb-4" marginTop={2} >
                All vacantions
              </Typography>
              <VacancyList 
                items={vacancies}
                onChoose={(id, title) => {
                  setSelectedOfferId(id);
                  setPresetInterest(title);
                  const el = document.getElementById('seeker-form');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                canApply={!currentUser}
              />
              {!currentUser && (
                <>
                  <Typography variant="h6" className="mt-6 mb-4" marginTop={4}>
                    Aply now at vacantion
                  </Typography>
                  <SeekerForm selectedOfferId={selectedOfferId} onApply={applyForJob} presetInterest={presetInterest} />
                </>
              )}
            </Paper>
          }
        />
        <Route
          path="/allposts"
          element={
            <Paper elevation={3} className="p-6" aria-live="polite" sx={{ maxWidth: { xs: '100%', sm: 720, md: 900 }, width: '100%', mx: 'auto' }}>
              <Typography variant="h5" className="mb-4">
                Toate anunțurile
              </Typography>
              <VacancyList
                items={vacancies}
                onChoose={(id, title) => {
                  setSelectedOfferId(id);
                  setPresetInterest(title);
                  const el = document.getElementById('seeker-form');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                canApply={!currentUser}
              />
              {!currentUser && (
                <>
                  <Typography variant="h6" className="mt-6 mb-4">
                    Aply Now
                  </Typography>
                  <SeekerForm selectedOfferId={selectedOfferId} onApply={applyForJob} presetInterest={presetInterest} />
                </>
              )}
            </Paper>
          }
        />
        <Route
          path="/myposts"
          element={
            <Paper elevation={3} className="p-6" aria-live="polite" sx={{ maxWidth: { xs: '100%', sm: 720, md: 900 }, width: '100%', mx: 'auto' }}>
              <Typography variant="h5" align='center' className="mb-4">
                Adaugă post vacant
              </Typography>
              <EmployerForm onCreate={createVacancy} />
              <Typography variant="h5" align='center' className="mb-4" mt={6}>
                Anunțurile mele
              </Typography>
              <EmployerList items={myVacancies} onEdit={updateVacancy} onDelete={deleteVacancy} />
            </Paper>
          }
        />
        <Route
          path="/candidatslist"
          element={
            <Paper elevation={3} className="p-6" aria-live="polite" sx={{ maxWidth: { xs: '100%', sm: 720, md: 900 }, width: '100%', mx: 'auto' }}>
              <Typography variant="h5" className="mb-4">
                Candidați pentru anunțurile mele
              </Typography>
              <CandidateList items={candidates} onEdit={updateCandidate} />
            </Paper>
          }
        />
        <Route
          path="/login"
          element={
            currentUser ? (
              <Navigate to="/myposts" replace />
            ) : (
              <>
                <Paper elevation={3} className="p-6 mb-6" sx={{ maxWidth: 900, width: '100%', mx: 'auto' }}>
                  <Typography variant="h5" className="mb-4">
                    Autentificare
                  </Typography>
                  <Login onRegister={onRegister} onLogin={onLogin} />
                  <Typography variant="caption" className="mt-2 text-gray-600">
                    Employer: folosiți Register pentru a crea cont; candidații pot face login direct.
                  </Typography>
                </Paper>
              </>
            )
          }
        />
      </Routes>
      </Box>
      </Container>
    </ThemeProvider>
  );
}

interface LoginProps {
  onRegister: (u: string, p: string) => Promise<string>;
  onLogin: (u: string, p: string, r: Role) => Promise<string | null>;
}

function Login({ onRegister, onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role] = useState<Role>('EMPLOYER');
  const [error, setError] = useState<string | null>(null);

  return (
    <Box className="space-y-4">
      <TextField
        id="auth-username"
        label="Utilizator"
        variant="outlined"
        fullWidth
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="username"
        autoComplete="username"
      />
      <TextField
        id="auth-password"
        label="Parolă"
        type="password"
        variant="outlined"
        fullWidth
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="parola"
        autoComplete="current-password"
      />
      <FormControl fullWidth>
        {/* <InputLabel id="auth-role-label">Rol</InputLabel>
        <Select
          labelId="auth-role-label"
          id="auth-role"
          value={role}
          label="Rol"
          onChange={(e) => setRole(e.target.value as Role)}
        >
          <MenuItem value="EMPLOYER">Angajator</MenuItem>
        </Select> */}
      </FormControl>
      <Box className="flex gap-4">
        <Button
          id="btn-login"
          variant="contained"
          color="primary"
          onClick={async () => {
            const m = await onLogin(username, password, role);
            setError(m);
          }}
        >
          Login
        </Button>
        <Button
          id="btn-register"
          variant="outlined"
          color="secondary"
          onClick={async () => {
            const m = await onRegister(username, password);
            setError(m);
          }}
        >
          Register (doar angajatori)
        </Button>
      </Box>
      {error && (
        <Typography color="error" variant="body2" aria-live="assertive">
          {error}
        </Typography>
      )}
    </Box>
  );
}

interface EmployerFormProps {
  onCreate: (v: Pick<Vacancy, 'title' | 'text' | 'region' | 'salary'> & { images?: string[] }) => Promise<void> | void;
}

function EmployerForm({ onCreate }: EmployerFormProps) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [region, setRegion] = useState('');
  const [salary, setSalary] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eMap: Record<string, string> = {};
    if (!title) eMap['vacancy-title'] = 'Titlul este obligatoriu';
    if (!text) eMap['vacancy-text'] = 'Textul este obligatoriu';
    if (!region) eMap['vacancy-region'] = 'Regiunea este obligatorie';
    setErrors(eMap);
    if (Object.keys(eMap).length) return;
    await onCreate({ title, text, region, salary, images });
    setTitle('');
    setText('');
    setRegion('');
    setSalary('');
    setImages([]);
  };

  return (
    <Box component="form" id="employer-form" noValidate onSubmit={handleSubmit} className="space-y-4">
      <TextField
        id="vacancy-title"
        label="Titlul anunțului"
        variant="outlined"
        fullWidth
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Ex: Склад брендовой одежды"
        error={!!errors['vacancy-title']}
        helperText={errors['vacancy-title']}
      />
      <TextField
        id="vacancy-text"
        label="Text anunț"
        variant="outlined"
        fullWidth
        required
        multiline
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Descrierea postului, cerințe, beneficii..."
        error={!!errors['vacancy-text']}
        helperText={errors['vacancy-text']}
      />
      <TextField
        id="vacancy-region"
        label="Țara sau regiunea"
        variant="outlined"
        fullWidth
        required
        value={region}
        onChange={(e) => setRegion(e.target.value)}
        placeholder="Ex: Moldova / Chișinău"
        error={!!errors['vacancy-region']}
        helperText={errors['vacancy-region']}
      />
      <TextField
        id="vacancy-salary"
        label="Salariu"
        variant="outlined"
        fullWidth
        value={salary}
        onChange={(e) => setSalary(e.target.value)}
        placeholder="Ex: 12000 MDL"
        inputProps={{ inputMode: 'decimal' }}
      />
      <ImageUpload images={images} setImages={setImages} />
      <Box className="flex justify-end">
        <Button type="submit" variant="contained" color="primary">
          Publică anunț
        </Button>
      </Box>
    </Box>
  );
}

function ImageUpload({ images, setImages }: { images: string[]; setImages: React.Dispatch<React.SetStateAction<string[]>> }) {
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const token = (() => { try { return JSON.parse(localStorage.getItem('birjatg_currentUser') || '{}')?.token || ''; } catch { return ''; } })();
      const resp = await fetch('/api/images/direct-upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const { uploadURL } = await resp.json();
      if (!resp.ok || !uploadURL) throw new Error('Eroare obținere URL upload');
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        const r = await fetch(uploadURL, { method: 'POST', body: fd });
        const d = await r.json();
        if (!r.ok || !d?.result?.id) throw new Error('Eroare upload imagine');
        const id = d.result.id as string;
        // Use the variant URL from Cloudflare response instead of constructing it
        const variantUrl = d.result.variants?.[0] || `https://imagedelivery.net/ACCOUNT_HASH/${id}/public`;
        newUrls.push(variantUrl);
      }
      setImages((prev) => [...prev, ...newUrls]);
    } catch (e: any) {
      alert(e.message || 'Eroare la încărcarea imaginilor');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Typography variant="subtitle1" className="mb-2">Imagini</Typography>
      <input type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files)} />
      {uploading && <Typography variant="caption">Se încarcă...</Typography>}
      {images.length > 0 && (
        <Box className="mt-2 flex flex-wrap gap-2">
          {images.map((url, idx) => (
            <img key={idx} src={url} alt="preview" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }} />
          ))}
        </Box>
      )}
    </Box>
  );
}

interface EmployerListProps {
  items: Vacancy[];
  onEdit: (id: number, v: Vacancy) => void;
  onDelete: (id: number) => void;
}

function EmployerList({ items, onEdit, onDelete }: EmployerListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Vacancy>>({});
  const [editImages, setEditImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const parseImages = (imagesStr: string | null): string[] => {
    if (!imagesStr) return [];
    try {
      return JSON.parse(imagesStr);
    } catch {
      return [];
    }
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const token = (() => { try { return JSON.parse(localStorage.getItem('birjatg_currentUser') || '{}')?.token || ''; } catch { return ''; } })();
      const resp = await fetch('/api/images/direct-upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const { uploadURL } = await resp.json();
      if (!resp.ok || !uploadURL) throw new Error('Eroare obținere URL upload');
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        const r = await fetch(uploadURL, { method: 'POST', body: fd });
        const d = await r.json();
        if (!r.ok || !d?.result?.id) throw new Error('Eroare upload imagine');
        const id = d.result.id as string;
        const variantUrl = d.result.variants?.[0] || `https://imagedelivery.net/ACCOUNT_HASH/${id}/public`;
        newUrls.push(variantUrl);
      }
      setEditImages((prev) => [...prev, ...newUrls]);
    } catch (e: any) {
      alert(e.message || 'Eroare la încărcarea imaginilor');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setEditImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Box id="employer-list" className="space-y-4">
      {items.length === 0 ? (
        <Typography>Încă nu ați publicat anunțuri.</Typography>
      ) : (
        items.map((v) => {
          const images = parseImages(v.images || null);
          return (
            <Card key={v.id} variant="outlined" className="p-4">
              {editingId === v.id ? (
                <Box component="form" className="space-y-4" onSubmit={(e) => { 
                  e.preventDefault(); 
                  onEdit(v.id, { ...v, ...form, images: editImages.join(',') }); 
                  setEditingId(null); 
                  setEditImages([]);
                }}>
                  <TextField
                    label="Titlu"
                    fullWidth
                    defaultValue={v.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  />
                  <TextField
                    label="Text"
                    fullWidth
                    multiline
                    rows={3}
                    defaultValue={v.text}
                    onChange={(e) => setForm((prev) => ({ ...prev, text: e.target.value }))}
                  />
                  <TextField
                    label="Regiune"
                    fullWidth
                    defaultValue={v.region}
                    onChange={(e) => setForm((prev) => ({ ...prev, region: e.target.value }))}
                  />
                  <TextField
                    label="Salariu"
                    fullWidth
                    defaultValue={v.salary}
                    onChange={(e) => setForm((prev) => ({ ...prev, salary: e.target.value }))}
                  />
                  
                  {/* Image Management Section */}
                  <Box>
                    <Typography variant="subtitle1" className="mb-2">Imagini</Typography>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      onChange={(e) => handleImageUpload(e.target.files)} 
                    />
                    {uploading && <Typography variant="caption">Se încarcă...</Typography>}
                    
                    {/* Current Images */}
                    {editImages.length > 0 && (
                      <Box className="mt-2 flex flex-wrap gap-2">
                        {editImages.map((imageUrl, idx) => (
                          <Box key={idx} style={{ position: 'relative', display: 'inline-block' }}>
                            <img 
                              src={imageUrl} 
                              alt={`Edit imagine ${idx + 1}`}
                              style={{ 
                                width: 80, 
                                height: 80, 
                                objectFit: 'cover', 
                                borderRadius: 4,
                                border: '1px solid #ddd'
                              }}
                            />
                            <Button
                              size="small"
                              variant="contained"
                              color="error"
                              style={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                minWidth: 24,
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                fontSize: '12px',
                                padding: 0
                              }}
                              onClick={() => removeImage(idx)}
                            >
                              ×
                            </Button>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                  
                  <Box className="flex gap-4">
                    <Button type="submit" variant="contained" color="primary">
                      Salvează
                    </Button>
                    <Button variant="outlined" color="secondary" onClick={() => {
                      setEditingId(null);
                      setEditImages([]);
                    }}>
                      Anulează
                    </Button>
                  </Box>
                </Box>
              ) : (
                <CardContent>
                  <Typography variant="h6">{escapeHtml(v.title)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {escapeHtml(v.region)} · <span>{escapeHtml(v.salary || '')}</span>
                  </Typography>
                  <Typography variant="body1">{escapeHtml(v.text || '')}</Typography>
                  {images.length > 0 && (
                    <Box className="mt-2 flex flex-wrap gap-2">
                      {images.map((imageUrl, idx) => (
                        <img 
                          key={idx} 
                          src={imageUrl} 
                          alt={`${v.title} - imagine ${idx + 1}`}
                          style={{ 
                            width: 100, 
                            height: 100, 
                            objectFit: 'cover', 
                            borderRadius: 4,
                            border: '1px solid #ddd'
                          }}
                          onError={(e) => {
                            console.warn('Failed to load image:', imageUrl);
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ))}
                    </Box>
                  )}
                  <CardActions>
                    <Button size="small" onClick={() => { 
                      setEditingId(v.id); 
                      setForm({}); 
                      setEditImages(parseImages(v.images || null));
                    }}>
                      Editează
                    </Button>
                    <Button size="small" onClick={() => onDelete(v.id)}>
                      Șterge
                    </Button>
                  </CardActions>
                </CardContent>
              )}
            </Card>
          );
        })
      )}
    </Box>
  );
}

interface VacancyListProps {
  items: Vacancy[];
  onChoose: (id: number, title: string) => void;
  canApply?: boolean;
}

function VacancyList({ items, onChoose, canApply = true }: VacancyListProps) {
  const parseImages = (imagesStr: string | null): string[] => {
    if (!imagesStr) return [];
    try {
      return JSON.parse(imagesStr);
    } catch {
      return [];
    }
  };

  return (
    <Box id="vacancy-list" className="space-y-4">
      {items.length === 0 ? (
        <Typography>Nu sunt posturi vacante momentan.</Typography>
      ) : (
        items.map((v) => {
          const images = parseImages(v.images || null);
          return (
            <Card key={v.id} variant="outlined" className="p-4">
              <CardContent>
                <Typography variant="h6">{escapeHtml(v.title)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {escapeHtml(v.region)}
                </Typography>
                <Typography variant="body2">{escapeHtml(v.salary || '')}</Typography>
                <Typography variant="body1">{escapeHtml(v.text || '')}</Typography>
                {images.length > 0 && (
                  <Box className="mt-2 flex flex-wrap gap-2">
                    {images.map((imageUrl, idx) => (
                      <img 
                        key={idx} 
                        src={imageUrl} 
                        alt={`${v.title} - imagine ${idx + 1}`}
                        style={{ 
                          width: 100, 
                          height: 100, 
                          objectFit: 'cover', 
                          borderRadius: 4,
                          border: '1px solid #ddd'
                        }}
                        onError={(e) => {
                          console.warn('Failed to load image:', imageUrl);
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ))}
                  </Box>
                )}
              </CardContent>
              {canApply && (
                <CardActions>
                  <Button variant="contained" color="primary" onClick={() => onChoose(v.id, v.title)}>
                    Aply Now
                  </Button>
                </CardActions>
              )}
            </Card>
          );
        })
      )}
    </Box>
  );
}

interface SeekerFormProps {
  selectedOfferId: number | null;
  onApply: (p: Omit<ApplicationItem, 'id'>) => Promise<boolean>;
  applicantId?: string;
  presetInterest?: string;
}

function SeekerForm({ selectedOfferId, onApply, applicantId, presetInterest }: SeekerFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('');
  const [interest, setInterest] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (presetInterest) setInterest(presetInterest);
  }, [presetInterest]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eMap: Record<string, string> = {};
    if (!name) eMap['seeker-name'] = 'Numele este obligatoriu';
    if (!phone) eMap['seeker-phone'] = 'Telefonul este obligatoriu';
    if (!region) eMap['seeker-region'] = 'Regiunea este obligatorie';
    setErrors(eMap);
    if (Object.keys(eMap).length) return;
    const ok = await onApply({ offerId: selectedOfferId ?? undefined, name, phone, region, interest, applicantId });
    if (ok) {
      setName('');
      setPhone('');
      setRegion('');
      setInterest('');
    }
  };

  return (
    <Box component="form" id="seeker-form" noValidate onSubmit={handleSubmit} className="space-y-4" marginBottom={2}>
      <TextField
        id="seeker-name"
        label="Nume"
        variant="outlined"
        fullWidth
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Numele dvs."
        error={!!errors['seeker-name']}
        helperText={errors['seeker-name']}
      />
      <TextField
        id="seeker-phone"
        label="Număr telefon"
        type="tel"
        variant="outlined"
        fullWidth
        required
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Ex: +373 69 000 000"
        error={!!errors['seeker-phone']}
        helperText={errors['seeker-phone']}
      />
      <TextField
        id="seeker-region"
        label="Regiunea unde vă aflați"
        variant="outlined"
        fullWidth
        required
        value={region}
        onChange={(e) => setRegion(e.target.value)}
        placeholder="Ex: Chișinău"
        error={!!errors['seeker-region']}
        helperText={errors['seeker-region']}
      />
      <TextField
        id="seeker-interest"
        label="Предложение работы которое вас интересует"
        variant="outlined"
        fullWidth
        value={interest}
        onChange={(e) => setInterest(e.target.value)}
        placeholder="— încă nu am decis —"
      />
      <Box className="flex justify-end">
        <Button type="submit" variant="contained" color="primary">
          Aply Now
        </Button>
      </Box>
    </Box>
  );
}

interface CandidateListProps {
  items: ApplicationItem[];
  onEdit?: (id: number, payload: Partial<ApplicationItem>) => void | Promise<void>;
}

function CandidateList({ items, onEdit }: CandidateListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<ApplicationItem>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [editImages, setEditImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const parseImages = (imagesStr: string | null): string[] => {
    if (!imagesStr) return [];
    try {
      return JSON.parse(imagesStr);
    } catch {
      return [];
    }
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const token = (() => { try { return JSON.parse(localStorage.getItem('birjatg_currentUser') || '{}')?.token || ''; } catch { return ''; } })();
      const resp = await fetch('/api/images/direct-upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const { uploadURL } = await resp.json();
      if (!resp.ok || !uploadURL) throw new Error('Eroare obținere URL upload');
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        const r = await fetch(uploadURL, { method: 'POST', body: fd });
        const d = await r.json();
        if (!r.ok || !d?.result?.id) throw new Error('Eroare upload imagine');
        const id = d.result.id as string;
        const variantUrl = d.result.variants?.[0] || `https://imagedelivery.net/ACCOUNT_HASH/${id}/public`;
        newUrls.push(variantUrl);
      }
      setEditImages((prev) => [...prev, ...newUrls]);
    } catch (e: any) {
      alert(e.message || 'Eroare la încărcarea imaginilor');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setEditImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Box id="employer-candidates" className="space-y-4">
      <Box className="flex justify-between items-center mb-4">
        <Typography variant="h6">Candidați</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setShowAddForm(true)}
        >
          Adaugă candidat nou
        </Button>
      </Box>
      
      {showAddForm && (
        <Paper elevation={2} className="p-4 mb-4">
          <Typography variant="h6" className="mb-3">Adaugă candidat nou</Typography>
          <CandidateForm
            onSubmit={async (candidateData) => {
              try {
                const resp = await fetch('/api/employer/candidates', {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json', 
                    Authorization: `Bearer ${localStorage.getItem('birjatg_currentUser') ? JSON.parse(localStorage.getItem('birjatg_currentUser')!).token : ''}` 
                  },
                  body: JSON.stringify(candidateData),
                });
                if (!resp.ok) {
                  const error = await resp.json();
                  throw new Error(error.error || 'Eroare la crearea candidatului');
                }
                setShowAddForm(false);
                // Refresh the candidates list
                window.location.reload();
              } catch (error: any) {
                alert(error.message || 'Eroare la crearea candidatului');
              }
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </Paper>
      )}
      
      {items.length === 0 ? (
        <Typography>Nu sunt aplicații încă.</Typography>
      ) : (
        items.map((a) => (
          <Card key={a.id} variant="outlined" className="p-4">
            {editingId === a.id ? (
              <Box component="form" className="space-y-3" onSubmit={(e) => { 
                e.preventDefault(); 
                onEdit && onEdit(a.id, { ...form, images: editImages.join(',') }); 
                setEditingId(null); 
                setEditImages([]);
              }}>
                <TextField label="Nume" fullWidth defaultValue={a.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                <TextField label="Telefon" fullWidth defaultValue={a.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
                <TextField label="Regiune" fullWidth defaultValue={a.region} onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))} />
                <TextField label="Interes" fullWidth defaultValue={a.interest || ''} onChange={(e) => setForm((p) => ({ ...p, interest: e.target.value }))} />
                <TextField label="Contract" fullWidth defaultValue={a.Contract || ''} onChange={(e) => setForm((p) => ({ ...p, contract: e.target.value }))} />
                <TextField label="Age" type="number" fullWidth defaultValue={a.Age ?? ''} onChange={(e) => setForm((p) => ({ ...p, age: Number(e.target.value) }))} />
                <TextField label="Experience" fullWidth defaultValue={a.Experience || ''} onChange={(e) => setForm((p) => ({ ...p, experience: e.target.value }))} />
                <TextField label="SalaryWorker" fullWidth defaultValue={a.SalaryWorker || ''} onChange={(e) => setForm((p) => ({ ...p, salaryWorker: e.target.value }))} />
                <FormControl fullWidth>
                  <InputLabel id={`status-label-${a.id}`}>Status</InputLabel>
                  <Select labelId={`status-label-${a.id}`} label="Status" defaultValue={a.status || 'new'} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as string }))}>
                    <MenuItem value="new">new</MenuItem>
                    <MenuItem value="reviewed">reviewed</MenuItem>
                    <MenuItem value="contacted">contacted</MenuItem>
                    <MenuItem value="rejected">rejected</MenuItem>
                    <MenuItem value="hired">hired</MenuItem>
                  </Select>
                </FormControl>
                
                {/* Image Management Section */}
                <Box>
                  <Typography variant="subtitle1" className="mb-2">Imagini candidat</Typography>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={(e) => handleImageUpload(e.target.files)} 
                  />
                  {uploading && <Typography variant="caption">Se încarcă...</Typography>}
                  
                  {/* Current Images */}
                  {editImages.length > 0 && (
                    <Box className="mt-2 flex flex-wrap gap-2">
                      {editImages.map((imageUrl, idx) => (
                        <Box key={idx} style={{ position: 'relative', display: 'inline-block' }}>
                          <img 
                            src={imageUrl} 
                            alt={`Candidat imagine ${idx + 1}`}
                            style={{ 
                              width: 80, 
                              height: 80, 
                              objectFit: 'cover', 
                              borderRadius: 4,
                              border: '1px solid #ddd'
                            }}
                          />
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            style={{
                              position: 'absolute',
                              top: -8,
                              right: -8,
                              minWidth: 24,
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              fontSize: '12px',
                              padding: 0
                            }}
                            onClick={() => removeImage(idx)}
                          >
                            ×
                          </Button>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
                
                <Box className="flex gap-4">
                  <Button type="submit" variant="contained">Salvează</Button>
                  <Button variant="outlined" onClick={() => { 
                    setEditingId(null); 
                    setForm({}); 
                    setEditImages([]);
                  }}>Anulează</Button>
                </Box>
              </Box>
            ) : (
              <CardContent>
                <Typography variant="h6">
                  {escapeHtml(a.name)} — {escapeHtml(a.phone)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {escapeHtml(a.region)} · Oferta: {escapeHtml(a.offer?.title || String(a.offerId ?? ''))}
                </Typography>
                <Typography variant="body1">{escapeHtml(a.interest || '')}</Typography>
                {(a.Contract || a.Age !== undefined || a.Experience || a.SalaryWorker) && (
                  <Typography variant="body2" color="text.secondary">
                    {a.Contract ? `Contract: ${escapeHtml(a.Contract)} · ` : ''}
                    {a.Age ? `Age: ${escapeHtml(a.Age)}` : ''}
                    {(a.Age && (a.Experience || a.SalaryWorker)) ? ' · ' : ''}
                    {a.Experience ? `Experience: ${escapeHtml(a.Experience)}` : ''}
                    {(a.Experience && a.SalaryWorker) ? ' · ' : ''}
                    {a.SalaryWorker ? `salary: ${escapeHtml(a.SalaryWorker)}` : ''}
                  </Typography>
                )}
                
                {/* Display candidate images */}
                {(() => {
                  const images = parseImages(a.images || null);
                  return images.length > 0 && (
                    <Box className="mt-2 flex flex-wrap gap-2">
                      {images.map((imageUrl, idx) => (
                        <img 
                          key={idx} 
                          src={imageUrl} 
                          alt={`${a.name} - imagine ${idx + 1}`}
                          style={{ 
                            width: 80, 
                            height: 80, 
                            objectFit: 'cover', 
                            borderRadius: 4,
                            border: '1px solid #ddd'
                          }}
                          onError={(e) => {
                            console.warn('Failed to load image:', imageUrl);
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ))}
                    </Box>
                  );
                })()}
                
                <Typography variant="caption" color="text.secondary">Status: {escapeHtml(a.status || 'new')}</Typography>
                <CardActions>
                  <Button size="small" onClick={() => { 
                    setEditingId(a.id); 
                    setForm({}); 
                    setEditImages(parseImages(a.images || null));
                  }}>Edit</Button>
                </CardActions>
              </CardContent>
            )}
          </Card>
        ))
      )}
    </Box>
  );
}

interface CandidateFormProps {
  onSubmit: (data: Partial<ApplicationItem>) => Promise<void>;
  onCancel: () => void;
}

function CandidateForm({ onSubmit, onCancel }: CandidateFormProps) {
  const [formData, setFormData] = useState<Partial<ApplicationItem>>({
    name: '',
    phone: '',
    region: '',
    interest: '',
    Contract: '',
    Age: undefined,
    Experience: '',
    SalaryWorker: '',
    status: 'new'
  });
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const token = (() => { try { return JSON.parse(localStorage.getItem('birjatg_currentUser') || '{}')?.token || ''; } catch { return ''; } })();
      const resp = await fetch('/api/images/direct-upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const { uploadURL } = await resp.json();
      if (!resp.ok || !uploadURL) throw new Error('Eroare obținere URL upload');
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        const r = await fetch(uploadURL, { method: 'POST', body: fd });
        const d = await r.json();
        if (!r.ok || !d?.result?.id) throw new Error('Eroare upload imagine');
        const id = d.result.id as string;
        const variantUrl = d.result.variants?.[0] || `https://imagedelivery.net/ACCOUNT_HASH/${id}/public`;
        newUrls.push(variantUrl);
      }
      setImages((prev) => [...prev, ...newUrls]);
    } catch (e: any) {
      alert(e.message || 'Eroare la încărcarea imaginilor');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.region) {
      alert('Completați câmpurile obligatorii');
      return;
    }
    await onSubmit({ ...formData, images: images.join(',') });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} className="space-y-3">
      <TextField
        label="Nume *"
        fullWidth
        required
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
      />
      <TextField
        label="Telefon *"
        fullWidth
        required
        value={formData.phone}
        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
      />
      <TextField
        label="Regiune *"
        fullWidth
        required
        value={formData.region}
        onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
      />
      <TextField
        label="Interes"
        fullWidth
        value={formData.interest}
        onChange={(e) => setFormData(prev => ({ ...prev, interest: e.target.value }))}
      />
      <TextField
        label="Contract"
        fullWidth
        value={formData.Contract}
        onChange={(e) => setFormData(prev => ({ ...prev, Contract: e.target.value }))}
      />
      <TextField
        label="Age"
        type="number"
        fullWidth
        value={formData.Age || ''}
        onChange={(e) => setFormData(prev => ({ ...prev, Age: Number(e.target.value) || undefined }))}
      />
      <TextField
        label="Experience"
        fullWidth
        value={formData.Experience}
        onChange={(e) => setFormData(prev => ({ ...prev, Experience: e.target.value }))}
      />
      <TextField
        label="SalaryWorker"
        fullWidth
        value={formData.SalaryWorker}
        onChange={(e) => setFormData(prev => ({ ...prev, SalaryWorker: e.target.value }))}
      />
      
      {/* Image Management Section */}
      <Box>
        <Typography variant="subtitle1" className="mb-2">Imagini candidat</Typography>
        <input 
          type="file" 
          accept="image/*" 
          multiple 
          onChange={(e) => handleImageUpload(e.target.files)} 
        />
        {uploading && <Typography variant="caption">Se încarcă...</Typography>}
        
        {/* Current Images */}
        {images.length > 0 && (
          <Box className="mt-2 flex flex-wrap gap-2">
            {images.map((imageUrl, idx) => (
              <Box key={idx} style={{ position: 'relative', display: 'inline-block' }}>
                <img 
                  src={imageUrl} 
                  alt={`Candidat imagine ${idx + 1}`}
                  style={{ 
                    width: 80, 
                    height: 80, 
                    objectFit: 'cover', 
                    borderRadius: 4,
                    border: '1px solid #ddd'
                  }}
                />
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    minWidth: 24,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    fontSize: '12px',
                    padding: 0
                  }}
                  onClick={() => removeImage(idx)}
                >
                  ×
                </Button>
              </Box>
            ))}
          </Box>
        )}
      </Box>
      
      <Box className="flex gap-3">
        <Button type="submit" variant="contained" color="primary">
          Salvează candidat
        </Button>
        <Button variant="outlined" onClick={onCancel}>
          Anulează
        </Button>
      </Box>
    </Box>
  );
}
