// --- Cấu hình MQTT (Đảm bảo khớp với ESP32 của bạn) ---
const MQTT_BROKER_HOST = '06e8b6781884440da3ee8bcff720af3f.s1.eu.hivemq.cloud';
const MQTT_BROKER_PORT = 8883; // Sử dụng cổng 8883 cho SSL/TLS
const MQTT_USERNAME = 'doremon';
const MQTT_PASSWORD = 'Doremon123';
const MQTT_CLIENT_ID = 'WebDashboard_Phuong_' + Math.random().toString(16).substr(2, 8); // ID duy nhất

// --- MQTT Topics (Đảm bảo khớp với ESP32 của bạn) ---
const TOPIC_LED1_CONTROL = "esp32/led1_control"; // Để gửi lệnh tới LED1
const TOPIC_LED2_CONTROL = "esp32/led2_control"; // Để gửi lệnh tới LED2
const TOPIC_BUTTON1_STATUS = "esp32/button1_status"; // Để nhận trạng thái nút 1
const TOPIC_BUTTON2_STATUS = "esp32/button2_status"; // Để nhận trạng thái nút 2
const TOPIC_LED1_STATUS = "esp32/led1_status"; // Để nhận trạng thái LED1 từ ESP32 (do nút bấm thay đổi)
const TOPIC_LED2_STATUS = "esp32/led2_status"; // Để nhận trạng thái LED2 từ ESP32 (do nút bấm thay đổi)


// --- Các phần tử HTML ---
const mqttStatusSpan = document.getElementById('mqttStatus');
const led1OnBtn = document.getElementById('led1On');
const led1OffBtn = document.getElementById('led1Off');
const led1StatusIndicator = document.getElementById('led1Status');
const led2OnBtn = document.getElementById('led2On');
const led2OffBtn = document.getElementById('led2Off');
const led2StatusIndicator = document.getElementById('led2Status');
const button1Indicator = document.getElementById('button1Indicator');
const button2Indicator = document.getElementById('button2Indicator');
const mqttLogDiv = document.getElementById('mqttLog');

let client; // Biến client MQTT

// --- Hàm ghi log ra giao diện ---
function logToDashboard(message) {
    const p = document.createElement('p');
    p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    mqttLogDiv.prepend(p); // Thêm vào đầu để tin nhắn mới nhất ở trên
    if (mqttLogDiv.children.length > 50) { // Giới hạn số lượng log
        mqttLogDiv.removeChild(mqttLogDiv.lastChild);
    }
}

// --- Hàm cập nhật trạng thái kết nối MQTT ---
function updateMqttStatus(status) {
    mqttStatusSpan.textContent = status;
    mqttStatusSpan.className = ''; // Xóa các class cũ
    if (status === 'Connected') {
        mqttStatusSpan.classList.add('connected');
        logToDashboard('MQTT: Connected to broker.');
    } else {
        mqttStatusSpan.classList.add('disconnected');
        logToDashboard('MQTT: Disconnected or connecting...');
    }
}

// --- Hàm cập nhật trạng thái LED trên giao diện ---
function updateLedStatus(ledId, status) {
    const indicator = ledId === 1 ? led1StatusIndicator : led2StatusIndicator;
    indicator.textContent = status;
    indicator.className = 'status-indicator'; // Xóa các class cũ
    if (status === 'ON') {
        indicator.classList.add('on');
    } else if (status === 'OFF') {
        indicator.classList.add('off');
    } else {
        indicator.classList.add('unknown');
    }
    logToDashboard(`LED ${ledId} status updated: ${status}`);
}

// --- Hàm cập nhật trạng thái Button trên giao diện ---
function updateButtonStatus(buttonId, status) {
    const indicator = buttonId === 1 ? button1Indicator : button2Indicator;
    indicator.textContent = status;
    indicator.className = 'status-indicator';
    if (status === 'PRESSED') {
        indicator.classList.add('pressed');
        // Nút sẽ tự trở về IDLE sau một thời gian ngắn
        setTimeout(() => {
            indicator.textContent = 'IDLE';
            indicator.className = 'status-indicator idle';
        }, 500); // 0.5 giây
    } else {
        indicator.classList.add('idle');
    }
    logToDashboard(`Button ${buttonId} status: ${status}`);
}


// --- Kết nối MQTT ---
function connectMqtt() {
    updateMqttStatus('Connecting');

    // Cấu hình kết nối SSL/TLS cho MQTT.js
    const connectOptions = {
        clean: true, // Bắt đầu một session mới
        keepalive: 60, // Thời gian giữ kết nối (giây)
        clientId: MQTT_CLIENT_ID,
        username: MQTT_USERNAME,
        password: MQTT_PASSWORD,
        // Cần thiết cho SSL/TLS
        protocol: 'mqtts', // Sử dụng mqtts cho cổng 8883 (SSL/TLS)
        port: MQTT_BROKER_PORT,
        rejectUnauthorized: false // Đặt là true nếu bạn có chứng chỉ CA và muốn xác thực chặt chẽ
        // Đặt false để bỏ qua xác thực chứng chỉ CA nếu gặp lỗi
    };

    client = mqtt.connect(`mqtts://${MQTT_BROKER_HOST}`, connectOptions);

    // --- Xử lý các sự kiện MQTT ---

    client.on('connect', () => {
        updateMqttStatus('Connected');
        logToDashboard('Subscribing to topics...');
        // Đăng ký các topic khi kết nối thành công
        client.subscribe(TOPIC_BUTTON1_STATUS, (err) => {
            if (err) logToDashboard(`Subscription error for ${TOPIC_BUTTON1_STATUS}: ${err}`);
            else logToDashboard(`Subscribed to ${TOPIC_BUTTON1_STATUS}`);
        });
        client.subscribe(TOPIC_BUTTON2_STATUS, (err) => {
            if (err) logToDashboard(`Subscription error for ${TOPIC_BUTTON2_STATUS}: ${err}`);
            else logToDashboard(`Subscribed to ${TOPIC_BUTTON2_STATUS}`);
        });
        client.subscribe(TOPIC_LED1_STATUS, (err) => {
            if (err) logToDashboard(`Subscription error for ${TOPIC_LED1_STATUS}: ${err}`);
            else logToDashboard(`Subscribed to ${TOPIC_LED1_STATUS}`);
        });
        client.subscribe(TOPIC_LED2_STATUS, (err) => {
            if (err) logToDashboard(`Subscription error for ${TOPIC_LED2_STATUS}: ${err}`);
            else logToDashboard(`Subscribed to ${TOPIC_LED2_STATUS}`);
        });
    });

    client.on('message', (topic, message) => {
        const msg = message.toString();
        logToDashboard(`Received: Topic: ${topic}, Message: ${msg}`);

        // Cập nhật trạng thái dựa trên tin nhắn nhận được
        if (topic === TOPIC_BUTTON1_STATUS) {
            updateButtonStatus(1, msg);
        } else if (topic === TOPIC_BUTTON2_STATUS) {
            updateButtonStatus(2, msg);
        } else if (topic === TOPIC_LED1_STATUS) {
            updateLedStatus(1, msg);
        } else if (topic === TOPIC_LED2_STATUS) {
            updateLedStatus(2, msg);
        }
    });

    client.on('reconnect', () => {
        updateMqttStatus('Reconnecting');
        logToDashboard('MQTT: Attempting to reconnect...');
    });

    client.on('error', (err) => {
        updateMqttStatus('Disconnected');
        logToDashboard(`MQTT Error: ${err.message}`);
        client.end(); // Ngắt kết nối để thử lại
        setTimeout(connectMqtt, 5000); // Thử kết nối lại sau 5 giây
    });

    client.on('close', () => {
        updateMqttStatus('Disconnected');
        logToDashboard('MQTT: Connection closed.');
    });
}

// --- Xử lý sự kiện click nút điều khiển LED ---
led1OnBtn.addEventListener('click', () => {
    if (client && client.connected) {
        client.publish(TOPIC_LED1_CONTROL, 'ON');
        logToDashboard('Published: LED 1 ON');
        updateLedStatus(1, 'ON'); // Cập nhật ngay trên giao diện
    } else {
        logToDashboard('Error: MQTT not connected to publish LED 1 ON.');
    }
});

led1OffBtn.addEventListener('click', () => {
    if (client && client.connected) {
        client.publish(TOPIC_LED1_CONTROL, 'OFF');
        logToDashboard('Published: LED 1 OFF');
        updateLedStatus(1, 'OFF'); // Cập nhật ngay trên giao diện
    } else {
        logToDashboard('Error: MQTT not connected to publish LED 1 OFF.');
    }
});

led2OnBtn.addEventListener('click', () => {
    if (client && client.connected) {
        client.publish(TOPIC_LED2_CONTROL, 'ON');
        logToDashboard('Published: LED 2 ON');
        updateLedStatus(2, 'ON'); // Cập nhật ngay trên giao diện
    } else {
        logToDashboard('Error: MQTT not connected to publish LED 2 ON.');
    }
});

led2OffBtn.addEventListener('click', () => {
    if (client && client.connected) {
        client.publish(TOPIC_LED2_CONTROL, 'OFF');
        logToDashboard('Published: LED 2 OFF');
        updateLedStatus(2, 'OFF'); // Cập nhật ngay trên giao diện
    } else {
        logToDashboard('Error: MQTT not connected to publish LED 2 OFF.');
    }
});


// --- Khởi tạo kết nối MQTT khi trang được tải ---
document.addEventListener('DOMContentLoaded', connectMqtt);