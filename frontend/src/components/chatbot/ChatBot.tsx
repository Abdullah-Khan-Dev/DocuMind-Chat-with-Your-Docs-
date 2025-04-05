import './ChatBot.css';
import submitButton from '../../assets/arrow.up.circle.fill.svg';
import React, { JSX, useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

const ChatBot = () => {
    const [chatHistory, setChatHistory] = useState<JSX.Element[]>([]);
    const [currentAIResponse, setCurrentAIResponse] = useState<string>('');
    const chatHistoryRef = useRef<HTMLDivElement>(null);
    const [query, setQuery] = useState<string>('');
    const [isStreaming, setIsStreaming] = useState<boolean>(false);

    useEffect(() => {
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [chatHistory, currentAIResponse]);

    const handleQueryChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setQuery(event.target.value);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setChatHistory(prevChats => [
            ...prevChats,
            <p key={Date.now()} className={`chat--bubble user--query`}>{query}</p>
        ]);
        setQuery('');
        setIsStreaming(true);
        setCurrentAIResponse('');

        try {
            const response = await fetch(`http://localhost:8080/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query: query })
            });

            const reader = response.body?.getReader();
            if (!reader) return;

            const decoder = new TextDecoder();
            let accumulatedResponse = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    setChatHistory(prevChats => [
                        ...prevChats,
                        <p key={Date.now()} className={`ai--response`}>
                            <ReactMarkdown>{accumulatedResponse}</ReactMarkdown>
                        </p>
                    ]);
                    setCurrentAIResponse('');
                    break;
                }

                const chunk = decoder.decode(value);
                accumulatedResponse += chunk;
                setCurrentAIResponse(accumulatedResponse);
            }
        } catch (error) {
            console.error('Error streaming response:', error);
            setCurrentAIResponse('Error: Could not get response');
        } finally {
            setIsStreaming(false);
            setQuery('');
        }
    };

    return (
        <main>
            <section className={`chat--history`} ref={chatHistoryRef}>
                {chatHistory}
                {isStreaming && !currentAIResponse && (
                    <p className={`ai--response typing-indicator`}>...</p>
                )}
                {currentAIResponse && (
                    <p className={`ai--response`}>
                        <ReactMarkdown>{currentAIResponse}</ReactMarkdown>
                    </p>
                )}
            </section>
            <section className={`chat--input`}>
                <form onSubmit={handleSubmit}>
                    <div className={`chatbot--query__container`}>
                        <textarea
                            className={`chatbot--query`}
                            placeholder={"Message DocuMind"}
                            value={query}
                            onChange={handleQueryChange}
                            disabled={isStreaming}
                        />
                        <button
                            className={`chatbot--query__submit`}
                            disabled={query.length === 0 || isStreaming}
                        >
                            <img src={submitButton} alt={'Submit Query'}/>
                        </button>
                    </div>
                </form>
            </section>
        </main>
    );
};

export default ChatBot;