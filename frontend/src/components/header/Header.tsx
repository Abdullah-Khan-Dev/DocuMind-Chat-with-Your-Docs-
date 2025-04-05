import './Header.css';
import brain from '../../assets/brain.svg';
import {useModal} from "../modal-context/ModalContext";

const Header = () => {
    const {toggleModal} = useModal();
    return (
        <header className={"header"}>
            <img src={brain} alt={"A human brain"} className={'header--logo'}/>
            <h1>DocuMind</h1>
            <button className={`feed-me`} onClick={toggleModal}>Feed me</button>
        </header>

    );
}

export default Header;