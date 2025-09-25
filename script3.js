import react,{useState, useEffect,useRef } from 'react';

//main app component
export default function App(){
    //statr management
    const [username,setUsername] = useState('');
    const [isUsernameSet,setIsUsernameSet] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input,setInput] = useState('');
    const [isConnected, setIsConnected] = useState(false);

    //ref for the websockets instance
    const ws = useRef(null);
    const messagesEndref = useRef(null);

    //effect to scroll to the bottom of the chat on new messages
    useEffect(() => {
        messagesEndref.current?.scrollInView({ behavior:'smooth'});
    },[messages]);

    //effect for websocketsconnection management
    useEffect(() => {
        if (isUsernameSet && username){
            //connect to a public websocket echo server
            //this server will echo any message it receives to all connected clients.
            ws.current = new WebSocket('socketsbay.com/was/v2/1/demo');

            ws.current.onopen = () =>{
                console.log('Websocket Connected');
                setIsConnected(true);
                //Greet the User upon connection
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    username: 'System',
                    text: 'welcome, ${username}! You Are Now Connected.',
                    isSystem: true
                }]);
            };

            ws.current.onmessage = (event) => {
                try {
                    const receivedMessage = JSON.parse(event.data);
                    //simple validation
                    if (receivedMessage.username && receivedMessage.text && receivedMessage.timestamp) {
                        setMessages(prev => [...prev, {...receivedMessage, id: data.now()}]);
                    }
                } catch(error) {
                    //the echo server sometime sends a "pong" or connection confirmation which is not JSON
                    console.log("Received a non-JSON message:", event.data);
                }
            };

            ws.current.onclose = () => {
                console.log('Websocket disconnected!');
                setIsConnected(false);
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    username: 'System',
                    text: 'connection lost. please refresh to connect.',
                    isSystem: true
                }]);
            };

            ws.current.onerror = (error) => {
                //The error event itself is often not very descriptive,
                //logging that an error occurred is the main takeaway.
                console.error('Websocket error:', error);
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    username: 'System',
                    text: 'An error occured with the connection.',
                    isSystem: true
                }]);
            };

            //cleanup on component unmount
            return () => {
                ws.current.close();
            };
        }
    }, [isUsernameSet, username]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (input.trim() && ws.current && ws.current.readyState === WebSocket.OPEN) {
            const message = {
                username: username,
                text: input,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit',minute: '2-digit'}),
            };
            ws.current.send(JSON.stringify(message));
            setInput('');
        }
    };

    const handleSetUsername = (e) => {
        e.preventDefault();
        if(username.trim()){
            setIsUsernameSet(true);
        }
    };
    
    //render username selection screen 
    if(!isUsernameSet){
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100 dark::bg-gray-900 font-sans">
                <div className= "w-full max-w-sm p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
                    <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white">
                        Enter Chat
                    </h1>
                    <form onSubmit={handleSetUsername} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Choose a username
                            </label>
                            <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-2 mt-2 text-gray-700 bg-gray-200 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                            placeholder="e.g., CoolCat123"
                            autoComplete="off"
                            required
                            />
                        </div>
                         <button
                          type="submit"
                          className="w-full py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus-outline-none focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
                          >
                            Join chat
                         </button>
                    </form>
                </div>
            </div>
        );
    }

    //render main chat interface
    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 font-sans">
            {/*Header*/}
            <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-md">
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">React Real-time Chat</h1>
                <div className="flex items-center space-x-2">
                    <span className ={` h-3 w-3 rounded-full ${isConnected? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-sm text-gray-600 dark:text-gray-300"> {isConnected ?'Connected' :'Disconnected'}</span>
                </div>
            </header>

            {/*message area*/}
            <main className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                    {messages.map((msg) => (
                        <div key={msg.id}>
                            {/* System Messages*/}
                            {msg.isSystem ? (
                                <div className="text-center my-2">
                                    <span className="px-2 py-1mtext-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 rounded-full">
                                        {msg.text}
                                    </span>
                                </div>
                            ) : (
                                /*user messages*/
                                <div className={`flex items-end gap-2 ${msg.username === username ? 'justify-end' : 'justify-start'}`}>
                                    {/*Avatar*/}
                                    {msg.username !== username && (
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center font-bold text-gray-600 dark:text-gray-200">
                                            {msg.username.charAt(0).toUppercase()}
                                        </div>
                                    )}

                                    {/*Message bubble*/}
                                    <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-xl ${
                                        msg.username === username
                                        ? 'bg-blue-500 text-white rounded-br-none'
                                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-b1-none'
                                    }`}>
                                        {msg.username !==username && (
                                            <p className="text-xs font-bold text-gray-500 dark:text-blue-400 mb-1">{msg.username}</p>
                                        )}
                                        <p className="text-sm">{msg.text}</p>
                                        <p className={`text-xs mt-1 opacity-70 ${msg.username === username ? 'text-right' : 'text-left'}`}>
                                            {msg.timestamp}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndref} />
                </div>
            </main>

            {/*Inpur Form*/}
            <footer className="p-4 bg-white dark:bg-gray-800">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 w-full px-4 py-2 text-gray-700 bg-gray-200 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
                    placeholder="Type a message..."
                    autoComplete="off"
                    disabled={!isConnected}
                    />
                    <button
                    type="submit"
                    className="p-2 text-white bg-blue-600 rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={!input.trim() || !isConnected}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-90" veiwBox="0 0 20 20" fill="currentColor">
                          <path d="M10.894 2.553a1 1 0 00-1.788 01-7 14a1 1 0 001.169 1.40915-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.96215 1.428a11 0 001.17-1.4081-7-14z"/>
                        </svg>
                    </button>
                </form>
            </footer>
        </div>
    );
}