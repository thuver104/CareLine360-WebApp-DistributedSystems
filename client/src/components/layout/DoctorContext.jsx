import { createContext, useContext } from "react";

export const DoctorContext = createContext(null);

export const useDoctorContext = () => useContext(DoctorContext);
