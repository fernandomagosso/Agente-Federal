// --- Imports ---
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from '@google/genai';

// --- Speech Recognition Polyfill ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// --- Constants & Config ---
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
    apiKeyPrompt: 'Para começar, insira sua chave da API do Gemini.',
    apiKeyPlaceholder: 'Insira sua chave da API aqui...',
    setApiKey: 'Definir Chave',
    verifyingApiKey: 'Verificando...',
    invalidApiKey: 'Chave de API inválida ou incorreta. Por favor, verifique e tente novamente.',
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
    apiKeyPrompt: 'To begin, please enter your Gemini API Key.',
    apiKeyPlaceholder: 'Enter your API Key here...',
    setApiKey: 'Set Key',
    verifyingApiKey: 'Verifying...',
    invalidApiKey: 'Invalid or incorrect API key. Please check it and try again.',
  }
};

const getSystemInstruction = (difficulty, lang) => {
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

const difficultyMap = { 'Fácil': 'Easy', 'Médio': 'Medium', 'Difícil': 'Hard' };
const topicKeys = ['reasonForTravel', 'fathersAuth', 'accommodation', 'financialResources', 'tiesToBrazil'];

// --- App Component ---
const App = () => {
    const [ai, setAi] = useState(null);
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [isVerifyingKey, setIsVerifyingKey] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [language, setLanguage] = useState('pt-BR');
    const [difficulty, setDifficulty] = useState('Médio');
    const [simulationStarted, setSimulationStarted] = useState(false);
    const [selectedTopicKey, setSelectedTopicKey] = useState('');
    const [customTopic, setCustomTopic] = useState('');
    const chatRef = useRef(null);
    const chatHistoryRef = useRef(null);
    const recognitionRef = useRef(null);
    const texts = i18n[language];

    useEffect(() => {
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const speak = (text, lang) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleSetApiKey = async () => {
        const key = apiKeyInput.trim();
        if (!key) return;
        setIsVerifyingKey(true);
        try {
            const newAiInstance = new GoogleGenAI({ apiKey: key });
            const validationChat = newAiInstance.chats.create({ model: 'gemini-2.5-flash' });
            await validationChat.sendMessage({ message: "hello" });
            setAi(newAiInstance);
        } catch (error) {
            console.error("API Key validation failed:", error);
            alert(texts.invalidApiKey);
            setAi(null);
        } finally {
            setIsVerifyingKey(false);
        }
    };

    const handleStartSimulation = async () => {
        const topic = customTopic.trim() || (selectedTopicKey ? texts[selectedTopicKey] : '');
        if (!topic || !ai) return;

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
            const errorMessage = language === 'pt-BR' ? 'Erro ao iniciar a simulação.' : 'Error starting simulation.';
            setChatHistory([{ role: 'model', text: errorMessage }]);
            setSimulationStarted(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading || !chatRef.current) return;

        const userMessage = { role: 'user', text: userInput };
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
            const errorMessage = language === 'pt-BR' ? 'Erro ao receber resposta.' : 'Error receiving response.';
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
        if (!SpeechRecognition) {
            alert(texts.voiceNotSupported);
            return;
        }
        if (!recognitionRef.current) {
            recognitionRef.current = new SpeechRecognition();
        }
        const recognition = recognitionRef.current;
        if (isRecording) {
            recognition.stop();
            return;
        }
        recognition.lang = language;
        recognition.onstart = () => setIsRecording(true);
        recognition.onend = () => setIsRecording(false);
        recognition.onerror = (event) => {
            if (event.error === 'not-allowed') alert(texts.micPermissionError);
            console.error('Speech recognition error:', event.error);
            setIsRecording(false);
        };
        recognition.onresult = (event) => {
            const transcript = Array.from(event.results).map(r => r[0]).map(r => r.transcript).join('');
            setUserInput(transcript);
        };
        recognition.start();
    };

    const handleSettingChange = (setter, value) => {
        if (simulationStarted && chatHistory.length > 0) {
            if (window.confirm(texts.changeSettingConfirm)) {
                setter(value);
                handleClearHistory();
            }
        } else {
            setter(value);
        }
    };

    const difficultyOptions = ['Fácil', 'Médio', 'Difícil'];
    const langOptions = ['pt-BR', 'en-US'];

    return React.createElement("div", { className: "app-container" },
        React.createElement("aside", { className: "control-panel" },
            React.createElement("h1", null, texts.title),
            React.createElement("p", null, texts.description),
            !ai && React.createElement("div", { className: "control-section api-key-section" },
                React.createElement("h2", null, texts.apiKeyPrompt),
                React.createElement("input", {
                    type: "password",
                    value: apiKeyInput,
                    onChange: (e) => setApiKeyInput(e.target.value),
                    placeholder: texts.apiKeyPlaceholder
                }),
                React.createElement("button", { onClick: handleSetApiKey, className: "btn", disabled: !apiKeyInput.trim() || isVerifyingKey },
                    isVerifyingKey ? texts.verifyingApiKey : texts.setApiKey
                )
            ),
            ai && React.createElement(React.Fragment, null,
                React.createElement("div", { className: "control-section" },
                    React.createElement("h2", null, texts.language),
                    React.createElement("div", { className: "segmented-control" },
                        langOptions.map(lang => React.createElement("button", {
                            key: lang,
                            className: `btn-segment ${language === lang ? 'active' : ''}`,
                            onClick: () => handleSettingChange(setLanguage, lang)
                        }, lang === 'pt-BR' ? 'Português' : 'English'))
                    )
                ),
                React.createElement("div", { className: "control-section" },
                    React.createElement("h2", null, texts.difficulty),
                    React.createElement("div", { className: "segmented-control" },
                        difficultyOptions.map(d => React.createElement("button", {
                            key: d,
                            className: `btn-segment ${difficulty === d ? 'active' : ''}`,
                            onClick: () => handleSettingChange(setDifficulty, d)
                        }, language === 'pt-BR' ? d : difficultyMap[d]))
                    )
                ),
                React.createElement("div", { className: "control-section" },
                    React.createElement("h2", null, texts.topic),
                    React.createElement("div", { className: "theme-buttons" },
                        topicKeys.map(topicKey => React.createElement("button", {
                            key: topicKey,
                            className: `btn ${selectedTopicKey === topicKey && !customTopic ? 'active' : ''}`,
                            onClick: () => { setSelectedTopicKey(topicKey); setCustomTopic(''); },
                            disabled: simulationStarted
                        }, texts[topicKey]))
                    )
                ),
                React.createElement("div", { className: "control-section custom-prompt" },
                    React.createElement("h2", null, texts.customTopic),
                    React.createElement("textarea", {
                        value: customTopic,
                        onChange: (e) => { setCustomTopic(e.target.value); setSelectedTopicKey(''); },
                        placeholder: texts.customPlaceholder,
                        disabled: simulationStarted
                    })
                ),
                React.createElement("button", { onClick: handleStartSimulation, className: "btn", disabled: simulationStarted || (!selectedTopicKey && !customTopic.trim()) || isLoading },
                    isLoading && !chatHistory.length ? (language === 'pt-BR' ? 'Iniciando...' : 'Starting...') : texts.startSimulation
                ),
                React.createElement("div", { className: "actions-bar" },
                    React.createElement("button", { onClick: handleShare, className: "btn btn-secondary", disabled: chatHistory.length === 0 }, texts.share),
                    React.createElement("button", { onClick: handleClearHistory, className: "btn btn-secondary", disabled: chatHistory.length === 0 }, texts.clear)
                )
            )
        ),
        React.createElement("main", { className: "chat-panel" },
            React.createElement("div", { className: "chat-history", ref: chatHistoryRef },
                chatHistory.map((msg, index) =>
                    React.createElement("div", { key: index, className: `chat-message ${msg.role}` },
                        React.createElement("div", { className: "message-header" },
                            React.createElement("span", { className: "role" }, msg.role === 'model' ? texts.agent : texts.mother),
                            msg.role === 'model' && React.createElement("button", { className: "btn icon-btn speak-btn", onClick: () => speak(msg.text, language), title: "Ouvir novamente" },
                                React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24" },
                                    React.createElement("path", { d: "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" })
                                )
                            )
                        ),
                        React.createElement("p", null, msg.text)
                    )
                ),
                isLoading && chatHistory.length > 0 && React.createElement("div", { className: "chat-message model" }, React.createElement("p", null, "..."))
            ),
            React.createElement("div", { className: "chat-input-area" },
                React.createElement("form", { onSubmit: handleSendMessage },
                    React.createElement("input", {
                        type: "text",
                        value: userInput,
                        onChange: (e) => setUserInput(e.target.value),
                        placeholder: texts.inputPlaceholder,
                        disabled: !simulationStarted || isLoading || !ai
                    }),
                    React.createElement("button", { type: "button", className: `icon-btn ${isRecording ? 'recording' : ''}`, onClick: handleVoiceInput, disabled: !simulationStarted || isLoading || !ai, title: "Gravar voz" },
                        React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24" },
                            React.createElement("path", { d: "M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" })
                        )
                    ),
                    React.createElement("button", { type: "submit", className: "icon-btn", disabled: !simulationStarted || isLoading || !userInput.trim() || !ai, title: "Enviar mensagem" },
                        React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24" },
                            React.createElement("path", { d: "M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" })
                        )
                    )
                )
            )
        )
    );
};

// --- Render App ---
document.addEventListener('DOMContentLoaded', () => {
    const rootElement = document.getElementById('root');
    const root = ReactDOM.createRoot(rootElement);
    root.render(React.createElement(App));
});