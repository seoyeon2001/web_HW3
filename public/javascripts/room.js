const localStorage_token = localStorage.getItem('토큰'); // 토큰을 가져온다.
const sessionStorage_token = sessionStorage.getItem('토큰'); // 토큰을 가져온다.
token = localStorage_token || sessionStorage_token; // 둘 중 하나라도 있으면 토큰으로 설정한다.

const socket = io(); // 방 소켓에 연결

let roomName = window.location.pathname.split('/').pop(); // 방 이름

socket.on('connect', async () => {
    try {
        // 방 이름을 먼저 가져옵니다.
        const roomName = window.location.pathname.split('/').pop();

        // 그 후에 fetch를 수행합니다.
        const response = await fetch(`/room/${roomName}/get-user-id`, {
            method: 'GET',
            headers: {
                'authorization': `${token}`,
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const userId = data.userId;
        alert(`${roomName}방에 들어왔습니다.`);

        const myID = document.getElementById("myID");
        myID.innerHTML = `내ID: ${userId}`

        await startMedia();

        socket.emit('joinRoom', { roomName: roomName, userId: userId });
    } catch (error) {
        console.error('에러', error);
    }
});

socket.on('userJoined', (userId) => {
    const roomName = window.location.pathname.split('/').pop(); // 방 이름

    const messagesContainer = document.getElementById('messages');

    // HTML에 메시지 동적으로 추가
    const messageElement = document.createElement('p');
    messageElement.textContent = `${userId}님 입장`;
    messagesContainer.appendChild(messageElement);

    // 추가된 메시지가 화면에서 보일 수 있도록 스크롤 조정
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

socket.on('userLeft', (userId) => {
    const messagesContainer = document.getElementById('messages');

    // HTML에 메시지 동적으로 추가
    const messageElement = document.createElement('p');
    messageElement.textContent = `${userId}님 퇴장`;
    messagesContainer.appendChild(messageElement);

    // 추가된 메시지가 화면에서 보일 수 있도록 스크롤 조정
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

socket.on('updateUserList', async (userIds) => {
    const userListContainer = document.getElementById('userList');
    console.log(userIds);

    userListContainer.innerHTML = '';

    userIds.forEach(async (userId) => {
        const userElement = document.createElement('li');
        userElement.textContent = userId;
        userListContainer.appendChild(userElement);

        if (userId !== myID.textContent.split(' ')[1]) {
            const partnerID = document.getElementById("partnerID");
            partnerID.innerHTML = `상대방ID: ${userId}`;

            try {
                const response = await fetch(`/record/allinfo/${userId}`, {
                    method: 'GET',
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                console.log(data);
                document.getElementById('partnerWins').innerText = `승리 횟수: ${data.wins}`;
                document.getElementById('partnerLosses').innerText = `실패 횟수: ${data.losses}`;
                const winRate = (data.wins / (data.wins + data.losses) * 100).toFixed(2) || 0;
                document.getElementById('partnerWinRate').innerText = `승률: ${winRate}%`;
                // UI에서 파트너의 정보를 업데이트하세요.
            } catch (error) {
                console.error('상대방 정보를 받아오지 못했습니다.', error);
            }
        }
    });
});


socket.on('startGame', () => {
    console.log('게임을 시작합니다.'); // 삭제할 거
    alert('게임을 시작합니다.');
    const game = document.getElementById('game');
    game.style.display = 'block';
});

document.querySelector('button[value="ready"]').addEventListener('click', function(event) {
    event.preventDefault(); // 기본 동작 방지
    console.log('준비 버튼을 눌렀습니다.');
    socket.emit('ready');
});

const sliderContainer = document.getElementById("slider-container");
const slider = document.getElementById("slider");
const output = document.getElementById("output");

let direction = 1;
let speed = getRandomSpeed();

function moveSlider() {
    const sliderPosition = slider.offsetLeft;
    const containerWidth = sliderContainer.offsetWidth;
    const sliderWidth = slider.offsetWidth;

    if ( sliderPosition >= containerWidth - sliderWidth || sliderPosition <= 0 ) {
        direction *= -1;
    }

    const newPosition = Math.max(
        0,
        Math.min(
        containerWidth - sliderWidth,
        sliderPosition + direction * speed
        )
    );
    slider.style.left = newPosition + "px";
}

function showValue() {
    const sliderPosition = slider.offsetLeft;
    const containerWidth = sliderContainer.offsetWidth;
    const sliderWidth = slider.offsetWidth;
    const value = Math.floor( (sliderPosition / (containerWidth - sliderWidth)) * 100 );
    output.innerText = `Current Value: ${value}`;

    socket.emit('value', value );
}

socket.on('updateCurrentValue', (currentValue) => {
    const nowValueShow = document.getElementById('nowValueShow');
    nowValueShow.innerHTML = ''; // 기존 내용 지우기
    const pElement = document.createElement('p');
    pElement.textContent = `병뚜껑 체력: ${currentValue}`;
    nowValueShow.appendChild(pElement);
});

function getRandomSpeed() {
    return (Math.random() + 0.1) * 13;
}

function changeSpeed() {
    speed = getRandomSpeed();
}

setInterval(moveSlider, 10);
setInterval(changeSpeed, 1000); // 1초마다 속도를 변경합니다.

socket.on('finish', (data) => {
    console.log(data)
    console.log('게임이 끝났습니다.'); // 삭제할 거
    console.log(data.result);
    if (data.result === 'win') {
        alert('게임에서 이겼습니다.\n승리 화면으로 이동합니다.');
        window.location.href = '/record/win';
    } else if (data.result == 'lose') {
        alert('게임에서 졌습니다.\n패배 화면으로 이동합니다.');
        window.location.href = '/record/lose';
    }
});

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");
const audioSelect = document.getElementById("audios");

let myStream;
let muted = false;
let cameraOff = false;

const getCameras = async () => {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === "videoinput");
        console.log('cameras');
        console.log(cameras);
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach((camera) => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if (currentCamera.label == camera.label) {
                option.selected = true;
            }
            cameraSelect.appendChild(option);
        });
    } catch (error) {
        console.log(error);
    }
}

const getAudios = async () => {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audios = devices.filter((device) => device.kind === "audioinput");
        console.log('audios');
        console.log(audios);
        const currentAudio = myStream.getVideoTracks()[0];
        audios.forEach((audio) => {
            const option = document.createElement("option");
            option.value = audio.deviceId;
            option.innerText = audio.label;
            if (currentAudio.label == audio.label) {
                option.selected = true;
            }
            audioSelect.appendChild(option);
        });
    } catch (error) {
        console.log(error);
    }
}

const getCamera = async (deviceId) => {
    const initialConstrains = { // 초기 값
        audio: true,
        video: { facingMode: "user" }, // 전면카메라
    };
    const cameraConstraints = {
        audio: true,
        video: { deviceId: { exact: deviceId } },
    };
    try {
        myStream = await navigator.mediaDevices.getUserMedia(deviceId? cameraConstraints : initialConstrains);
        myFace.srcObject = myStream;
        if (!deviceId) {
            await getCameras();
        }
    } catch (error) {
        console.log(error);
    }
}

const getAudio = async (deviceId) => {
    const initialConstrains = { // 초기 값
        audio: true,
        video: { facingMode: "user" }, // 전면카메라
    };
    const audioConstraints = {
        audio: { deviceId: { exact: deviceId } },
        video: true,
    };
    try {
        myStream = await navigator.mediaDevices.getUserMedia(deviceId? audioConstraints : initialConstrains);
        myFace.srcObject = myStream;
        if (!deviceId) {
            await getAudios();
        }
    } catch (error) {
        console.log(error);
    }
}

const getMedia = async () => {
   await getCamera();
    await getAudio();
}

// getMedia();

const handleMuteClick = () => {
  myStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
  if (!muted) {
    muteBtn.innerText = "소리 활성화";
    muted = true;
  } else {
    muteBtn.innerText = "음소거";
    muted = false;
  }
};

const handleCameraClick = () => {
  myStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
  if (!cameraOff) {
    cameraBtn.innerText = "카메라 켜기";
    cameraOff = true;
  } else {
    cameraBtn.innerText = "카메라 끄기";
    cameraOff = false;
  }
};

const handleCameraChange = async () => {
    await getCamera(cameraSelect.value);
    if (myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection.getSenders().find((sender) => sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack);
    }
}

const handleAudioChange = async () => {
    await getAudio(audioSelect.value);
    if (myPeerConnection) {
        const audioTrack = myStream.getAudioTracks()[0];
        const audioSender = myPeerConnection.getSenders().find((sender) => sender.track.kind === "audio");
        audioSender.replaceTrack(audioTrack);
    }
}

const startMedia = async () => {
  await getMedia();
  makeConnection();
};

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("input", handleCameraChange);
audioSelect.addEventListener("input", handleAudioChange);

// // socket 구현 부분

socket.on("welcome", async () => {
    console.log("someone joined");
  const offer = await myPeerConnection.createOffer();
  console.log(offer);
  myPeerConnection.setLocalDescription(offer);
  socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => {
  //console.log(offer);
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  //console.log(answer);
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomName);
});

socket.on("answer", (answer) => {
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
  myPeerConnection.addIceCandidate(ice);
});

// RTC 구현 부분

let myPeerConnection;

const makeConnection = () => {
  myPeerConnection = new RTCPeerConnection({iceServers: [
    {
        urls: [
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
            "stun:stun3.l.google.com:19302",
            "stun:stun4.l.google.com:19302",
        ],
    },
]});
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("addstream", handleAddStream);
  myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track, myStream));
};

const handleIce = (data) => {
  //console.log(data.candidate);
  socket.emit("ice", data.candidate, roomName);
};

const handleAddStream = (data) => {
  const peerFace = document.getElementById("peerFace");
  peerFace.srcObject = data.stream;
};
