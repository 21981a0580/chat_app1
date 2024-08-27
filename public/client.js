const socket = io('http://localhost:9000', { transports: ['websocket'] });

const form = document.getElementById('send-container');
const messageInput = document.getElementById('messageInp');
const messageContainer = document.querySelector('.container');
const fileInput = document.getElementById('fileInput');
const typingIndicator = document.getElementById('typing-indicator');
const audio = new Audio('/chim_tipak_dam_dam.mp3');

audio.onloadeddata = () => {
    console.log('Audio file loaded successfully.');
};
audio.onerror = (e) => {
    console.error('Error loading audio file:', e);
};

const appendMessage = (message, position, timestamp, messageId, fileUrl) => {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(position);
    messageElement.setAttribute('data-id', messageId);

    messageElement.innerHTML = `
        <span class="message-text">${message}</span>
        ${fileUrl ? `<a href="${fileUrl}" download>Download File</a>` : ''}
        <span class="timestamp">${timestamp}</span>
        <span class="status"></span>
    `;

    messageContainer.append(messageElement);

    if (position === 'left') {
        audio.play().catch(error => console.log('Audio play failed:', error));
    }
};

const handleFile = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
        socket.emit('file', { fileName: file.name, fileData: reader.result });
    };
    reader.readAsDataURL(file);
};

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value;
    const timestamp = new Date().toLocaleTimeString();
    const messageId = generateUniqueId();
    if (message) {
        appendMessage(`You: ${message}`, 'right', timestamp, messageId);
        socket.emit('send', { message, timestamp, id: messageId });
    }
    if (fileInput.files.length > 0) {
        handleFile(fileInput.files[0]);
    }
    messageInput.value = '';
    fileInput.value = ''; // Clear the file input
});

fileInput.addEventListener('change', (e) => {
    if (fileInput.files.length > 0) {
        handleFile(fileInput.files[0]);
    }
});

const name = prompt("Enter your name to join");

socket.emit('new-user-joined', name);

socket.on('user-joined', (name) => {
    const timestamp = new Date().toLocaleTimeString();
    appendMessage(`${name} joined the chat`, 'left', timestamp);
});

socket.on('receive', (data) => {
    appendMessage(`${data.name}: ${data.message}`, 'left', data.timestamp, data.id, data.fileUrl);
});

socket.on('file', (data) => {
    appendMessage(`${data.name} sent a file`, 'left', new Date().toLocaleTimeString(), generateUniqueId(), data.fileUrl);
});

socket.on('message-read', (messageId) => {
    const messageElement = document.querySelector(`.message[data-id="${messageId}"]`);
    if (messageElement) {
        messageElement.querySelector('.status').innerText = 'Read';
    }
});

socket.on('typing', (name) => {
    typingIndicator.innerText = `${name} is typing...`;
});

socket.on('stop-typing', () => {
    typingIndicator.innerText = '';
});

function generateUniqueId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}
