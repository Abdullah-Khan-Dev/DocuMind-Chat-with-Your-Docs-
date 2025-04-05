import {createContext, ReactNode, useState, useContext} from "react";

type ModalContextType = {
  on: boolean;
  toggleModal: () => void;
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({children} :{ children: ReactNode }) => {
    const [on, setOn] = useState<boolean>(false);
    const toggleModal = () => {
        setOn(prevState => !prevState);
    }
    return (
        <ModalContext.Provider value={{on, toggleModal}}>
            {children}
        </ModalContext.Provider>
    )
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};