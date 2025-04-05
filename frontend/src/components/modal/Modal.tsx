import { useModal } from "../modal-context/ModalContext.tsx";
import React, { useEffect, useRef, useState} from "react";
import './Modal.css';
import fileIcon from '../../assets/document.circle.svg';

const Modal = () => {
    const [msg, setMsg] = useState<string>('');
    const [isProgressing, setIsProgressing] = useState<boolean>(false);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const { on, toggleModal } = useModal();

    useEffect(() => {
        if (on) {
            dialogRef.current?.showModal();
        } else {
            dialogRef.current?.close();
        }
    }, [on]);
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        setIsProgressing(true);
        setMsg('');
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const file = formData.get('file') as File;
        if (file) {
            fetch('http://127.0.0.1:8000/upload_documents', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            }).then(async (response: Response): Promise<void> => {
                if (response.ok) {
                    setMsg("File uploaded successfully");
                    formRef.current?.reset();
                    setIsProgressing(false);
                } else {
                    try {
                        const data = await response.json();
                        setMsg(data.detail.msg);
                        setIsProgressing(false);
                    } catch (err) {
                        setMsg("Failed to parse error response");
                    }
                }
            }).catch(error => {
                setMsg("Network error occurred");
                setIsProgressing(false);
                console.error(error);
            });
        }
    };
    const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
        const dialogDimensions = dialogRef.current?.getBoundingClientRect();
        if (!dialogDimensions) return;

        if (
            e.clientX < dialogDimensions.left ||
            e.clientX > dialogDimensions.right ||
            e.clientY < dialogDimensions.top ||
            e.clientY > dialogDimensions.bottom
        ) {
            toggleModal();
        }
    };

    return (
        <dialog ref={dialogRef} onClick={handleDialogClick} className="custom-dialog">
            <form className={"modal--form"} onSubmit={handleSubmit} encType={"multipart/form-data"} ref={formRef} method={"POST"}>
                <section className={"modal--header"}>
                    <h3 style={{margin: "0"}}>Feed me documents</h3>
                    <p style={{margin:"0", fontSize:"14px", color:"#999999"}}>I eat PDF, DOCX, PPTX, XLSX, HTML, images, AsciiDoc, Markdown, and CSV files! </p>
                    <p style={{margin:"2px", fontSize:"14px", color:"#FF0000"}}>{msg}</p>
                </section>
                <section className={"modal--body"}>
                    <img src={fileIcon} alt={"Select a document"} style={{width: "40px"}}/>
                    <h4 style={{marginBottom: "0", marginTop: "5px"}}>Select a document to feed</h4>
                    <p style={{marginTop:"0", fontSize:"14px", color:"#999999"}}>I will take some time to complete my feed</p>
                    <input
                        type={"file"}
                        accept={".pdf"}
                        name={"file"}
                        className={"modal--file"}
                        disabled={isProgressing}
                    />
                </section>
                <section className={"modal--footer"}>
                    {!isProgressing &&
                        <>
                            <a className={`secondary--btn`} onClick={() => {
                            toggleModal();
                            formRef.current?.reset();
                            }}>Cancel</a>
                            <button type={'submit'}>Upload</button>
                        </>
                    }
                    {isProgressing && <progress id={'modal--file__uploading--progress'}></progress>}
                </section>
            </form>
        </dialog>
    );
};

export default Modal;
