import { Box, Typography } from "@mui/material";
import Switch from "@mui/material/Switch";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

export default function Navbar({ darkMode, onToggle }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 3,
        pb: 1.5,
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography variant="h6" fontWeight={700} color="primary">
        Attendance Tracker
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Brightness7Icon sx={{ opacity: darkMode ? 0.5 : 1 }} />
        <Switch
          checked={darkMode}
          onChange={onToggle}
          color="primary"
          inputProps={{ "aria-label": "přepínač tmavého/světlého režimu" }}
        />
        <Brightness4Icon sx={{ opacity: darkMode ? 1 : 0.5 }} />
      </Box>
    </Box>
  );
}
