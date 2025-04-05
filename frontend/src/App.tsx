import './App.css'
import Header from './components/header/Header.tsx';
import ChatBot from "./components/chatbot/ChatBot.tsx";
import Modal from "./components/modal/Modal.tsx";
import {ModalProvider} from './components/modal-context/ModalContext.tsx';

function App() {

    return (
        <>
            <ModalProvider>
                <Header />
                <Modal />
            </ModalProvider>
            <ChatBot />
        </>
    )
}

export default App
