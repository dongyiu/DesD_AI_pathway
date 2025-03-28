import { createContext, useContext, useState } from "react";

export const AuthContext = createContext(null);
console.log("creating context...")

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  console.log("✅ AuthProvider is rendering!", { user });

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  console.log("Use Auth")
  const context = useContext(AuthContext)
}