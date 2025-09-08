// --- Imports ---
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Chat } from '@google/genai';

// --- Speech Recognition Interfaces (for TypeScript) ---
// This ensures TypeScript understands the browser's SpeechRecognition API
interface SpeechRecognition extends EventTarget {
    grammars: any; // Simplified for this use case
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: (event: any) => void;
    onerror: (event: any) => void;
    onstart: () => void;
    onend: () => void;
}
interface SpeechRecognitionStatic {
    new(): SpeechRecognition;
}
// FIX: Add missing properties to the custom Window interface to avoid TypeScript errors.
// The original interface was overwriting the global Window type, removing standard properties
// like 'speechSynthesis', 'open', and 'confirm'.
interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
    speechSynthesis: SpeechSynthesis;
    open(url?: string, target?: string, features?: string): Window | null;
    confirm(message?: string): boolean;
}
declare var window: Window;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

// --- Types ---
type Role = 'user' | 'model';
type Language = 'pt-BR' | 'en-US';
type Difficulty = 'Fácil' | 'Médio' | 'Difícil';
type DifficultyEn = 'Easy' | 'Medium' | 'Hard';
type TopicKey = 'reasonForTravel' | 'fathersAuth' | 'accommodation' | 'financialResources' | 'tiesToBrazil';

interface Message {
  role: Role;
  text: string;
}

// --- Constants & Config ---
const API_KEY = process.env.API_KEY as string;
const ai = new GoogleGenAI({ apiKey: API_KEY });

const i18n = {
  'pt-BR': {
    title: 'Simulador de Abordagem',
    description: 'Você assume o papel da mãe. O Agente Federal Ernest fará as perguntas. Responda de forma clara e objetiva.',
    language: 'Idioma',
    difficulty: 'Nível de Dificuldade',
    easy: 'Fácil',
    medium: 'Médio',
    hard: 'Difícil',
    topic: 'Iniciar com Tópico',
    selectTopic: 'Selecione um tópico para iniciar...',
    reasonForTravel: 'Motivo da Viagem',
    fathersAuth: 'Autorização do Pai',
    accommodation: 'Hospedagem e Roteiro',
    financialResources: 'Recursos Financeiros',
    tiesToBrazil: 'Vínculos no Brasil',
    customTopic: 'Ou crie um tópico personalizado:',
    customPlaceholder: 'Ex: Questionar sobre a passagem de volta...',
    startSimulation: 'Iniciar Simulação',
    sendMessage: 'Enviar',
    inputPlaceholder: 'Digite sua resposta...',
    agent: 'Agente Ernest',
    mother: 'Mãe (Você)',
    share: 'Compartilhar',
    clear: 'Limpar Histórico',
    changeSettingConfirm: 'Mudar esta configuração irá reiniciar a simulação atual. Deseja continuar?',
    micPermissionError: 'Permissão para microfone negada. Por favor, habilite nas configurações do seu navegador.',
    voiceNotSupported: 'Reconhecimento de voz não é suportado neste navegador.',
  },
  'en-US': {
    title: 'Approach Simulation',
    description: 'You take on the role of the mother. Federal Agent Ernest will ask the questions. Answer clearly and objectively.',
    language: 'Language',
    difficulty: 'Difficulty Level',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    topic: 'Start with Topic',
    selectTopic: 'Select a topic to start...',
    reasonForTravel: 'Reason for Travel',
    fathersAuth: "Father's Authorization",
    accommodation: 'Accommodation & Itinerary',
    financialResources: 'Financial Resources',
    tiesToBrazil: 'Ties to Brazil',
    customTopic: 'Or create a custom topic:',
    customPlaceholder: 'E.g: Question about the return ticket...',
    startSimulation: 'Start Simulation',
    sendMessage: 'Send',
    inputPlaceholder: 'Type your answer...',
    agent: 'Agent Ernest',
    mother: 'Mother (You)',
    share: 'Share',
    clear: 'Clear History',
    changeSettingConfirm: 'Changing this setting will restart the current simulation. Do you want to continue?',
    micPermissionError: 'Microphone permission denied. Please enable it in your browser settings.',
    voiceNotSupported: 'Voice recognition is not supported in this browser.',
  }
};

const getSystemInstruction = (difficulty: Difficulty, lang: Language): string => {
  const instructions = {
      'Fácil': {
          'pt-BR': `Você é o Agente Federal Ernest. Seu tom é profissional, mas calmo e educado. Seu objetivo é fazer uma checagem de rotina. Faça perguntas claras e diretas, uma de cada vez. Você está investigando uma mãe viajando sozinha com a filha de 10 anos para a Europa. Comece a conversa com base no tópico inicial fornecido. Analise a resposta da mãe e faça uma pergunta de acompanhamento relevante. Responda APENAS em Português.`,
          'en-US': `You are Federal Agent Ernest. Your tone is professional, but calm and polite. Your goal is a routine check. Ask clear and direct questions, one at a time. You are investigating a mother traveling alone with her 10-year-old daughter to Europe. Start the conversation based on the initial topic provided. Analyze the mother's response and ask a relevant follow-up question. Respond ONLY in English.`
      },
      'Médio': {
          'pt-BR': `Você é o Agente Federal Ernest. Seu tom é formal, direto e cético. Seu objetivo é verificar a consistência da história. Faça perguntas específicas e detalhadas, uma de cada vez, buscando por qualquer inconsistência. Você está investigando uma mãe viajando sozinha com a filha de 10 anos para a Europa. Comece a conversa com base no tópico inicial fornecido. Analise a resposta da mãe e faça uma pergunta de acompanhamento perspicaz. Responda APENAS em Português.`,
          'en-US': `You are Federal Agent Ernest. Your tone is formal, direct, and skeptical. Your goal is to verify the consistency of the story. Ask specific and detailed questions, one at a time, looking for any inconsistencies. You are investigating a mother traveling alone with her 10-year-old daughter to Europe. Start the conversation based on the initial topic provided. Analyze the mother's response and ask a sharp follow-up question. Respond ONLY in English.`
      },
      'Difícil': {
          'pt-BR': `Você é o Agente Federal Ernest. Seu tom é intimidador, rápido e implacável. Seu objetivo é aplicar pressão para descobrir a verdade a qualquer custo. Suas perguntas são curtas, incisivas e podem mudar de tópico abruptamente para desestabilizar. Você está investigando uma mãe viajando sozinha com a filha de 10 anos para a Europa. Comece a conversa com base no tópico inicial fornecido. Analise a resposta da mãe e faça uma pergunta de acompanhamento desafiadora. Responda APENAS em Português.`,
          'en-US': `You are Federal Agent Ernest. Your tone is intimidating, fast-paced, and relentless. Your goal is to apply pressure to uncover the truth at all costs. Your questions are short, incisive, and may change topic abruptly to destabilize. You are investigating a mother traveling alone with her 10-year-old daughter to Europe. Start the conversation based on the initial topic provided. Analyze the mother's response and ask a challenging follow-up question. Respond ONLY in English.`
      }
  };
  return instructions[difficulty][lang];
};

const difficultyMap: Record<Difficulty, DifficultyEn> = {
    'Fácil': 'Easy',
    'Médio': 'Medium',
    'Difícil': 'Hard'
};

const topicKeys: TopicKey[] = ['reasonForTravel', 'fathersAuth', 'accommodation', 'financialResources', 'tiesToBrazil'];

// --- App Component ---
const App = () => {
    // State
    const [chatHistory, setChatHistory] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [language, setLanguage] = useState<Language>('pt-BR');
    const [difficulty, setDifficulty] = useState<Difficulty>('Médio');
    const [simulationStarted, setSimulationStarted] = useState(false);
    const [selectedTopicKey, setSelectedTopicKey] = useState<TopicKey | ''>('');
    const [customTopic, setCustomTopic] = useState('');
    const chatRef = useRef<Chat | null>(null);
    const chatHistoryRef = useRef<HTMLDivElement>(null);
    const texts = i18n[language];

    // Effects
    useEffect(() => {
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [chatHistory]);

    // Speech Synthesis
    const speak = (text: string, lang: Language) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop any previous speech
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            window.speechSynthesis.speak(utterance);
        }
    };

    // Handlers
    const handleStartSimulation = async () => {
        const topic = customTopic.trim() || (selectedTopicKey ? texts[selectedTopicKey] : '');
        if (!topic) return;

        setIsLoading(true);
        setSimulationStarted(true);
        setChatHistory([]);

        const systemInstruction = getSystemInstruction(difficulty, language);
        const temp = difficulty === 'Fácil' ? 0.9 : difficulty === 'Médio' ? 0.8 : 0.4;
        
        chatRef.current = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: { systemInstruction, temperature: temp },
        });

        try {
            const response = await chatRef.current.sendMessage({ message: `Inicie a conversa com este tópico: "${topic}"` });
            const agentResponseText = response.text;
            setChatHistory([{ role: 'model', text: agentResponseText }]);
            speak(agentResponseText, language);
        } catch (error) {
            console.error("Error starting simulation:", error);
            const errorMessage = language === 'pt-BR' ? 'Erro ao iniciar a simulação. Verifique sua chave de API e a conexão.' : 'Error starting simulation. Check your API key and connection.';
            setChatHistory([{ role: 'model', text: errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading || !chatRef.current) return;

        const userMessage: Message = { role: 'user', text: userInput };
        setChatHistory(prev => [...prev, userMessage]);
        setUserInput('');
        setIsLoading(true);

        try {
            const response = await chatRef.current.sendMessage({ message: userInput });
            const agentResponseText = response.text;
            setChatHistory(prev => [...prev, { role: 'model', text: agentResponseText }]);
            speak(agentResponseText, language);
        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage = language === 'pt-BR' ? 'Erro ao receber resposta do agente.' : 'Error receiving agent response.';
            setChatHistory(prev => [...prev, { role: 'model', text: errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearHistory = () => {
        setChatHistory([]);
        setSimulationStarted(false);
        chatRef.current = null;
        setSelectedTopicKey('');
        setCustomTopic('');
        window.speechSynthesis.cancel();
    };

    const handleShare = () => {
        const conversation = chatHistory.map(msg => `${msg.role === 'model' ? texts.agent : texts.mother}:\n${msg.text}`).join('\n\n');
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(conversation)}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleVoiceInput = () => {
        if (!recognition) {
            alert(texts.voiceNotSupported);
            return;
        }

        if (isRecording) {
            recognition.stop();
            setIsRecording(false);
            return;
        }

        recognition.lang = language;
        recognition.onstart = () => setIsRecording(true);
        recognition.onend = () => setIsRecording(false);
        recognition.onerror = (event: any) => {
            if (event.error === 'not-allowed') {
                alert(texts.micPermissionError);
            }
            console.error('Speech recognition error:', event.error);
            setIsRecording(false);
        };
        recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
                .map((result: any) => result[0])
                .map((result: any) => result.transcript)
                .join('');
            setUserInput(transcript);
        };

        recognition.start();
    };

    const handleSettingChange = (setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
        if (simulationStarted && chatHistory.length > 0) {
            if (window.confirm(texts.changeSettingConfirm)) {
                setter(value);
                handleClearHistory();
            }
        } else {
            setter(value);
        }
    };

    const difficultyOptions: Difficulty[] = ['Fácil', 'Médio', 'Difícil'];
    const langOptions: Language[] = ['pt-BR', 'en-US'];

    // Render
    return (
        <div className="app-container">
            <aside className="control-panel">
                <h1>{texts.title}</h1>
                <p>{texts.description}</p>

                <div className="control-section">
                    <h2>{texts.language}</h2>
                    <div className="segmented-control">
                        {langOptions.map(lang => (
                             <button
                                key={lang}
                                className={`btn-segment ${language === lang ? 'active' : ''}`}
                                onClick={() => handleSettingChange(setLanguage, lang)}
                            >
                                {lang === 'pt-BR' ? 'Português' : 'English'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="control-section">
                    <h2>{texts.difficulty}</h2>
                    <div className="segmented-control">
                       {difficultyOptions.map(d => (
                           <button
                                key={d}
                                className={`btn-segment ${difficulty === d ? 'active' : ''}`}
                                onClick={() => handleSettingChange(setDifficulty, d)}
                           >
                               {language === 'pt-BR' ? d : difficultyMap[d]}
                           </button>
                       ))}
                    </div>
                </div>

                <div className="control-section">
                    <h2>{texts.topic}</h2>
                    <div className="theme-buttons">
                        {topicKeys.map(topicKey => (
                             <button 
                                key={topicKey}
                                className={`btn ${selectedTopicKey === topicKey && !customTopic ? 'active' : ''}`} 
                                onClick={() => { setSelectedTopicKey(topicKey); setCustomTopic('');}} 
                                disabled={simulationStarted}
                            >
                                {texts[topicKey]}
                            </button>
                        ))}
                    </div>
                </div>

                 <div className="control-section custom-prompt">
                    <h2>{texts.customTopic}</h2>
                    <textarea
                        value={customTopic}
                        onChange={(e) => { setCustomTopic(e.target.value); setSelectedTopicKey(''); }}
                        placeholder={texts.customPlaceholder}
                        disabled={simulationStarted}
                    />
                </div>

                <button onClick={handleStartSimulation} className="btn" disabled={simulationStarted || (!selectedTopicKey && !customTopic.trim()) || isLoading}>
                    {isLoading && !chatHistory.length ? (language === 'pt-BR' ? 'Iniciando...' : 'Starting...') : texts.startSimulation}
                </button>

                <div className="actions-bar">
                    <button onClick={handleShare} className="btn btn-secondary" disabled={chatHistory.length === 0}>
                        {texts.share}
                    </button>
                    <button onClick={handleClearHistory} className="btn btn-secondary" disabled={chatHistory.length === 0}>
                        {texts.clear}
                    </button>
                </div>
            </aside>

            <main className="chat-panel">
                <div className="chat-history" ref={chatHistoryRef}>
                    {chatHistory.map((msg, index) => (
                        <div key={index} className={`chat-message ${msg.role}`}>
                           <div className="message-header">
                              <span className="role">{msg.role === 'model' ? texts.agent : texts.mother}</span>
                               {msg.role === 'model' && (
                                   <button className="btn icon-btn speak-btn" onClick={() => speak(msg.text, language)} title="Ouvir novamente">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></svg>
                                   </button>
                               )}
                           </div>
                            <p>{msg.text}</p>
                        </div>
                    ))}
                    {isLoading && chatHistory.length > 0 && <div className="chat-message model"><p>...</p></div>}
                </div>
                <div className="chat-input-area">
                    <form onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder={texts.inputPlaceholder}
                            disabled={!simulationStarted || isLoading}
                        />
                        <button type="button" className={`icon-btn ${isRecording ? 'recording' : ''}`} onClick={handleVoiceInput} disabled={!simulationStarted || isLoading} title="Gravar voz">
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"></path></svg>
                        </button>
                        <button type="submit" className="icon-btn" disabled={!simulationStarted || isLoading || !userInput.trim()} title="Enviar mensagem">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

// --- Render App ---
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element.');
}
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);