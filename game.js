// Lunar Lander - 月面着陸ゲーム - ゲームロジック

let gameState = {
    altitude: 1000,
    velocity: 0,
    fuel: 100,
    thrustPower: 0,
    gravity: 1.6, // 月の重力
    gameRunning: false,
    gameOver: false,
    isDemo: false,
    lastUserInput: Date.now(),
    demoActionTimer: 0
};

let gameInterval;
let displayText = '';

// キャンバスとコンテキストを取得
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function initGame() {
    gameState = {
        altitude: 1000,
        velocity: 0,
        fuel: 100,
        thrustPower: 0,
        gravity: 0.8,
        gameRunning: false,
        gameOver: false,
        isDemo: false,
        lastUserInput: Date.now() - 3000, // 3秒前に設定してデモが早く開始されるように
        demoActionTimer: 0
    };
    
    // デモ表示を確実に消す
    document.getElementById('demoText').style.display = 'none';
    
    updateDisplay();
    showWelcomeMessage();
}

function showWelcomeMessage() {
    displayText = `
=== 月面着陸ミッション ===

月面着陸船を操縦して安全に着陸させてください。

目標: 速度5m/s以下で月面に着陸
警告: 速度が速すぎると墜落します！

燃料は限られています。慎重に使用してください。

準備はよろしいですか？
    `;
    document.getElementById('gameArea').innerHTML = displayText;
}

function showInstructions() {
    displayText = `
=== 操作説明 ===

• [推進]ボタンまたは[T]キー: エンジン推進
• エンジンは重力に逆らって上向きの力を与えます
• 燃料が尽きるとエンジンは使用できません
• 高度0mで速度5m/s以下なら着陸成功
• 速度が速すぎると墜落します

物理法則:
• 重力: 1.6m/s²（月面）
• 推進力: 3.0m/s²

頑張って！
    `;
    document.getElementById('gameArea').innerHTML = displayText;
}

function startGame() {
    if (gameState.gameRunning) return;
    
    // デモモードを終了（表示も確実に消す）
    gameState.isDemo = false;
    document.getElementById('demoText').style.display = 'none';
    
    // ゲーム状態をリセット
    gameState = {
        altitude: 1000,
        velocity: 0,
        fuel: 100,
        thrustPower: 0,
        gravity: 0.8,  // 重力を半分に
        gameRunning: true,
        gameOver: false,
        isDemo: false,
        lastUserInput: Date.now(),
        demoActionTimer: 0
    };
    
    // デモモード中はボタンを有効にしておく
    if (!gameState.isDemo) {
        document.getElementById('startBtn').disabled = true;
        document.getElementById('startBtn').textContent = 'ゲーム開始';
    } else {
        document.getElementById('startBtn').disabled = false;
        document.getElementById('startBtn').textContent = 'プレイ開始';
    }
    
    displayText = `
ミッション開始！

月面着陸船が降下を開始しました。
燃料を管理しながら安全に着陸させてください。

    `;
    document.getElementById('gameArea').innerHTML = displayText;
    
    gameInterval = setInterval(gameLoop, 100);
}

function thrust() {
    if (!gameState.gameRunning || gameState.gameOver || gameState.fuel <= 0) return;
    
    gameState.thrustPower = 2.5;  // 推進力を強化
    gameState.fuel = Math.max(0, gameState.fuel - 0.8);  // 燃料消費を減らす
    
    // 推進エフェクトを一定時間維持
    setTimeout(() => {
        if (gameState.gameRunning && !gameState.gameOver) {
            gameState.thrustPower = 0;
        }
    }, 300);  // 効果時間を延長
}

function gameLoop() {
    // デモモードのチェック（ゲーム開始前のみ）
    if (!gameState.gameRunning && !gameState.gameOver) {
        checkDemoMode();
    }
    
    // デモモード中はAIが操作
    if (gameState.isDemo) {
        updateDemoAI();
        
        // デモモード中のゲームオーバー時は自動再開
        if (gameState.gameOver) {
            setTimeout(() => {
                initGame();
                gameState.isDemo = true;
                document.getElementById('demoText').style.display = 'block';
                setTimeout(() => {
                    if (gameState.isDemo) {
                        startGame();
                    }
                }, 2000);
            }, 3000);
        }
    }
    
    if (gameState.gameRunning && !gameState.gameOver) {
        // 物理計算（重力は下向き、推進は上向き）
        let netAcceleration = gameState.gravity - gameState.thrustPower;
        gameState.velocity += netAcceleration * 0.1;
        gameState.altitude -= gameState.velocity * 0.1;

        updateDisplay();
        updateGameArea();

        // ゲーム終了条件チェック
        if (gameState.altitude <= 0) {
            gameState.altitude = 0;
            endGame();
        }
    }
    
    // キャンバスを更新
    drawGame();
}

function updateDisplay() {
    document.getElementById('altitude').textContent = Math.round(gameState.altitude);
    document.getElementById('velocity').textContent = Math.round(gameState.velocity * 10) / 10;
    document.getElementById('fuel').textContent = Math.round(gameState.fuel);
    
    // 燃料警告
    if (gameState.fuel < 20) {
        document.getElementById('fuel').className = 'error';
    } else if (gameState.fuel < 40) {
        document.getElementById('fuel').className = 'warning';
    } else {
        document.getElementById('fuel').className = 'success';
    }
    
    // 速度警告
    if (gameState.velocity > 10) {
        document.getElementById('velocity').className = 'error';
    } else if (gameState.velocity > 5) {
        document.getElementById('velocity').className = 'warning';
    } else {
        document.getElementById('velocity').className = 'success';
    }
}

function updateGameArea() {
    let altitudeBar = '';
    let barLength = 40;
    let position = Math.round((1000 - gameState.altitude) / 1000 * barLength);
    
    for (let i = 0; i < barLength; i++) {
        if (i === position) {
            altitudeBar += '▼';
        } else if (i === barLength - 1) {
            altitudeBar += '█'; // 月面
        } else {
            altitudeBar += '·';
        }
    }

    let thrustIndicator = gameState.thrustPower > 0 ? '🔥' : '  ';
    let fuelBar = '█'.repeat(Math.round(gameState.fuel / 5));
    
    displayText = `
高度計:
${altitudeBar}

着陸船: ${thrustIndicator}
         ▲
        ███

燃料残量: ${fuelBar}

速度: ${gameState.velocity > 0 ? '↓' : gameState.velocity < 0 ? '↑' : '－'} ${Math.abs(gameState.velocity).toFixed(1)} m/s
    `;
    
    document.getElementById('gameArea').innerHTML = displayText;
}

function endGame() {
    gameState.gameRunning = false;
    gameState.gameOver = true;
    clearInterval(gameInterval);
    
    let result = '';
    if (Math.abs(gameState.velocity) <= 5) {
        result = `
🌙 *** 着陸成功！ ***

素晴らしい！月面への軟着陸に成功しました。
着陸速度: ${Math.abs(gameState.velocity).toFixed(1)} m/s
残燃料: ${gameState.fuel}%

月面での任務を開始してください。

        `;
    } else {
        result = `
💥 *** 墜落 ***

着陸船は月面に激突しました。
衝突速度: ${Math.abs(gameState.velocity).toFixed(1)} m/s

次回はもっと慎重に着陸してください。

        `;
    }
    
    document.getElementById('gameArea').innerHTML = result;
    
    // ボタンを即座に有効化してテキストを変更
    document.getElementById('startBtn').disabled = false;
    document.getElementById('startBtn').textContent = '再チャレンジ';
}

// キャンバスの描画処理
function drawGame() {
    // キャンバスをクリア
    ctx.fillStyle = '#000800';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 月面を描画
    drawLunarSurface();
    
    // 宇宙船を描画
    if (gameState.gameRunning || gameState.gameOver) {
        drawSpacecraft();
    }
    
    // 推進炎を描画
    if (gameState.thrustPower > 0 && gameState.gameRunning && !gameState.gameOver) {
        drawThrustFlame();
    }
    
    // 星を描画
    drawStars();
}

function drawLunarSurface() {
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    
    // 月面のライン
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 20);
    for (let x = 0; x < canvas.width; x += 20) {
        const y = canvas.height - 20 + Math.sin(x * 0.05) * 3;
        ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // 月面のテクスチャ
    ctx.fillStyle = '#003300';
    for (let x = 10; x < canvas.width; x += 30) {
        for (let y = canvas.height - 15; y < canvas.height; y += 5) {
            if (Math.random() > 0.7) {
                ctx.fillRect(x, y, 2, 2);
            }
        }
    }
}

function drawSpacecraft() {
    // 宇宙船の位置を計算
    const shipX = canvas.width / 2;
    const shipY = canvas.height - 20 - (gameState.altitude / 1000) * (canvas.height - 40);
    
    ctx.strokeStyle = gameState.isDemo ? '#00ffff' : '#00ff00';
    ctx.fillStyle = gameState.isDemo ? '#004444' : '#003300';
    ctx.lineWidth = 2;
    
    // デモモードの光る効果
    if (gameState.isDemo) {
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
    }
    
    // 宇宙船の本体（三角形）
    ctx.beginPath();
    ctx.moveTo(shipX, shipY - 10);
    ctx.lineTo(shipX - 8, shipY + 5);
    ctx.lineTo(shipX + 8, shipY + 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // 着陸脚
    ctx.beginPath();
    ctx.moveTo(shipX - 6, shipY + 5);
    ctx.lineTo(shipX - 10, shipY + 12);
    ctx.moveTo(shipX + 6, shipY + 5);
    ctx.lineTo(shipX + 10, shipY + 12);
    ctx.stroke();
    
    // シャドウをリセット
    ctx.shadowBlur = 0;
}

function drawThrustFlame() {
    const shipX = canvas.width / 2;
    const shipY = canvas.height - 20 - (gameState.altitude / 1000) * (canvas.height - 40);
    
    // 炎の色をランダムに変化
    const colors = ['#ff6600', '#ff3300', '#ffff00'];
    const flameColor = colors[Math.floor(Math.random() * colors.length)];
    
    ctx.strokeStyle = flameColor;
    ctx.fillStyle = flameColor;
    ctx.lineWidth = 2;
    
    // 炎の形状をランダムに変化
    const flameHeight = 15 + Math.random() * 10;
    const flameWidth = 4 + Math.random() * 4;
    
    ctx.beginPath();
    ctx.moveTo(shipX, shipY + 5);
    ctx.lineTo(shipX - flameWidth, shipY + flameHeight);
    ctx.lineTo(shipX + flameWidth, shipY + flameHeight);
    ctx.closePath();
    ctx.fill();
}

function drawStars() {
    ctx.fillStyle = '#00ff00';
    // 固定の星の位置
    const stars = [
        {x: 50, y: 50}, {x: 120, y: 30}, {x: 200, y: 70},
        {x: 280, y: 40}, {x: 350, y: 60}, {x: 80, y: 100},
        {x: 300, y: 120}, {x: 150, y: 90}, {x: 320, y: 80}
    ];
    
    stars.forEach(star => {
        if (Math.random() > 0.3) { // 星の点滅
            ctx.fillRect(star.x, star.y, 1, 1);
        }
    });
}

// デモモードのAI制御（改善版）
function updateDemoAI() {
    gameState.demoActionTimer++;
    
    if (!gameState.gameRunning || gameState.gameOver) return;
    
    // 高度と速度に基づいた精密な制御
    const altitudeRatio = gameState.altitude / 1000;
    const velocity = gameState.velocity;
    
    // 目標速度を高度に応じて計算
    let targetVelocity;
    if (altitudeRatio > 0.7) {
        targetVelocity = 10; // 高高度では速めに降下
    } else if (altitudeRatio > 0.5) {
        targetVelocity = 7; // 高高度では速めに降下
    } else if (altitudeRatio > 0.3) {
        targetVelocity = 5; // 中高度では中程度
    } else if (altitudeRatio > 0.1) {
        targetVelocity = 3; // 低高度では慎重に
    } else {
        targetVelocity = 1.5; // 着陸直前は非常に慎重に
    }
    
    // 着陸直前の特別制御
    if (gameState.altitude < 50) {
        targetVelocity = Math.min(targetVelocity, 2.5);
    }
    if (gameState.altitude < 20) {
        targetVelocity = Math.min(targetVelocity, 1.8);
    }
    
    // 推進判断の改善（より積極的に）
    const velocityDiff = velocity - targetVelocity;
    const shouldThrust = velocityDiff > 0.3; // 閾値を下げてより頻繁に推進
    
    // 燃料保存のための制御（より緩和）
    const fuelThreshold = Math.max(5, altitudeRatio * 20 + 5); // 最低限の燃料確保
    
    // 推進の頻度調整（より頻繁に）
    let thrustInterval;
    if (Math.abs(velocityDiff) > 2) {
        thrustInterval = 2; // 緊急時は非常に頻繁に
    } else if (Math.abs(velocityDiff) > 1) {
        thrustInterval = 4; // 通常時はより頻繁に
    } else if (Math.abs(velocityDiff) > 0.5) {
        thrustInterval = 6; // 細かい調整でも頻繁に
    } else {
        thrustInterval = 8; // 微調整
    }
    
    // より積極的な推進条件
    if (shouldThrust && 
        gameState.fuel > fuelThreshold && 
        gameState.demoActionTimer % thrustInterval === 0) {
        thrust();
    }
    
    // 緊急着陸制御（高速で地面に近づいている場合）
    if (gameState.altitude < 30 && velocity > 4) {
        thrust(); // 連続推進で緊急減速
    }
}

// デモモードのチェック
function checkDemoMode() {
    if (gameState.isDemo || gameState.gameRunning) return;
    
    // 5秒間操作がなければデモモード開始
    if (Date.now() - gameState.lastUserInput > 5000) {
        startDemo();
    }
}

// デモモード開始
function startDemo() {
    gameState.isDemo = true;
    gameState.demoActionTimer = 0;
    document.getElementById('demoText').style.display = 'block';
    
    // ボタンを有効化してテキストを変更
    document.getElementById('startBtn').disabled = false;
    document.getElementById('startBtn').textContent = 'プレイ開始';
    
    // ゲームを自動開始し、デモ用の説明を表示
    setTimeout(() => {
        if (gameState.isDemo) {
            displayText = `
=== デモンストレーション ===

AIが月面着陸を実演します。

高度と速度を確認しながら、
適切なタイミングでエンジンを点火し、
安全な着陸を目指します。

あなたも挜戦してみましょう！
            `;
            document.getElementById('gameArea').innerHTML = displayText;
            startGame();
        }
    }, 1500);
}

// デモモード終了
function stopDemo() {
    if (gameState.isDemo) {
        gameState.isDemo = false;
        document.getElementById('demoText').style.display = 'none';
    }
}

// キーボード操作
document.addEventListener('keydown', function(event) {
    // ユーザー入力を記録
    gameState.lastUserInput = Date.now();
    
    // デモモード中の場合は終了
    if (gameState.isDemo) {
        stopDemo();
    }
    
    if (event.key.toLowerCase() === 't') {
        thrust();
    }
});

// ボタンクリック時もユーザー入力として記録
document.getElementById('thrustBtn').addEventListener('click', () => {
    gameState.lastUserInput = Date.now();
    if (gameState.isDemo) {
        stopDemo();
    }
});

document.getElementById('startBtn').addEventListener('click', () => {
    gameState.lastUserInput = Date.now();
    if (gameState.isDemo) {
        stopDemo();
    }
});

// メインループを開始
setInterval(gameLoop, 50); // 20 FPS

// 初期化
initGame();
drawGame();