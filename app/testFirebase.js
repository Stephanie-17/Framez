import { auth } from "./services/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

export const testFirebase = () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("✅ Firebase connected. Logged in as:", user.email);
    } else {
      console.log("✅ Firebase connected. No user logged in.");
    }
  });
};
