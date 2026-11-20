const 화면 = document.getElementById("game");
const 붓 = 화면.getContext("2d");

const 너비 = 1024;
const 높이 = 768;
const 벽돌너비 = 58;
const 벽돌높이 = 28;
const 벽돌간격 = 6;
const 층별개수 = [15, 15, 14, 14, 14, 14, 14];
const 층별색 = ["#E53935", "#F57C00", "#FBC02D", "#43A047", "#1E88E5", "#3949AB", "#8E24AA"];
const 전체벽돌수 = 층별개수.reduce((합계, 개수) => 합계 + 개수, 0);
const 공속도배율 = 1.5;
const 벽돌시작Y = 75;
const 막대 = { x: (너비 - 150) / 2, y: 724, 너비: 150, 높이: 16, 속도: 650 };
const 공개수 = 3;
const 누른키 = { 왼쪽: false, 오른쪽: false };

let 벽돌 = [];
let 공들 = [];
let 점수 = 0;
let 목숨 = 3;
let 상태 = "대기";
let 이전시간 = 0;

function 벽돌만들기() {
  벽돌 = [];
  for (let 층 = 0; 층 < 층별개수.length; 층++) {
    const 개수 = 층별개수[층];
    const 시작X = (너비 - (개수 * 벽돌너비 + (개수 - 1) * 벽돌간격)) / 2;
    for (let 열 = 0; 열 < 개수; 열++) {
      벽돌.push({
        x: 시작X + 열 * (벽돌너비 + 벽돌간격),
        y: 벽돌시작Y + 층 * (벽돌높이 + 벽돌간격),
        색: 층별색[층],
        남음: true
      });
    }
  }
}

function 공놓기() {
  const 시작속도 = [-260, 0, 260];
  공들 = Array.from({ length: 공개수 }, (_, 번호) => ({
    x: 막대.x + 막대.너비 / 2 + (번호 - 1) * 30,
    y: 막대.y - 11,
    반지름: 9,
    vx: 시작속도[번호],
    vy: -350,
    회전: 0,
    회전힘: 0
  }));
}

function 새게임() {
  점수 = 0;
  목숨 = 3;
  막대.x = (너비 - 막대.너비) / 2;
  벽돌만들기();
  공놓기();
  상태 = "진행";
}

function 닿았는지(공, 네모) {
  const 가까운X = Math.max(네모.x, Math.min(공.x, 네모.x + 네모.너비));
  const 가까운Y = Math.max(네모.y, Math.min(공.y, 네모.y + 네모.높이));
  return (공.x - 가까운X) ** 2 + (공.y - 가까운Y) ** 2 <= 공.반지름 ** 2;
}

function 움직이기(경과시간) {
  const 방향 = Number(누른키.오른쪽) - Number(누른키.왼쪽);
  const 이전막대X = 막대.x;
  막대.x = Math.max(0, Math.min(너비 - 막대.너비, 막대.x + 방향 * 막대.속도 * 경과시간));
  const 막대이동속도 = 경과시간 > 0 ? (막대.x - 이전막대X) / 경과시간 : 0;

  if (상태 !== "진행") {
    if (상태 === "대기" || 상태 === "재시작 대기") 공놓기();
    return;
  }

  for (const 공 of 공들) {
    공움직이기(공, 경과시간, 막대이동속도);
    if (상태 === "승리") break;
  }
  if (상태 === "승리") return;
  공들 = 공들.filter((공) => 공.y - 공.반지름 <= 높이);
  if (공들.length === 0) {
    목숨--;
    상태 = 목숨 === 0 ? "종료" : "재시작 대기";
    if (목숨 > 0) 공놓기();
  }
}

function 공움직이기(공, 경과시간, 막대이동속도) {
  const 이전X = 공.x;
  const 이전Y = 공.y;
  const 공경과시간 = 경과시간 * 공속도배율;
  공.vx = Math.max(-550, Math.min(550, 공.vx + 공.회전힘 * 공경과시간));
  공.회전힘 *= Math.exp(-0.8 * 공경과시간);
  공.회전 += (공.vx / 공.반지름 + 공.회전힘 / 90) * 공경과시간;
  공.x += 공.vx * 공경과시간;
  공.y += 공.vy * 공경과시간;

  if (공.x - 공.반지름 <= 0) {
    공.x = 공.반지름;
    공.vx = Math.abs(공.vx);
  } else if (공.x + 공.반지름 >= 너비) {
    공.x = 너비 - 공.반지름;
    공.vx = -Math.abs(공.vx);
  }
  if (공.y - 공.반지름 <= 0) {
    공.y = 공.반지름;
    공.vy = Math.abs(공.vy);
  }

  if (공.vy > 0 && 이전Y + 공.반지름 <= 막대.y && 닿았는지(공, 막대)) {
    공.y = 막대.y - 공.반지름;
    공.vy = -Math.abs(공.vy);
    const 맞은위치 = (공.x - (막대.x + 막대.너비 / 2)) / (막대.너비 / 2);
    공.vx = Math.max(-500, Math.min(500, 맞은위치 * 330 + 막대이동속도 * 0.3));
    공.회전힘 = Math.max(-300, Math.min(300, 맞은위치 * 140 + 막대이동속도 * 0.22));
  }

  for (const 한개 of 벽돌) {
    if (!한개.남음 || !닿았는지(공, { ...한개, 너비: 벽돌너비, 높이: 벽돌높이 })) continue;
    한개.남음 = false;
    점수 += 10;

    if (이전X + 공.반지름 <= 한개.x || 이전X - 공.반지름 >= 한개.x + 벽돌너비) {
      공.vx *= -1;
    } else {
      공.vy *= -1;
    }
    if (점수 === 전체벽돌수 * 10) 상태 = "승리";
    break;
  }

}

function 그리기() {
  붓.clearRect(0, 0, 너비, 높이);
  붓.fillStyle = "#000000";
  붓.font = "bold 24px Arial, 'Malgun Gothic', sans-serif";
  붓.textAlign = "left";
  붓.fillText(`점수: ${점수}`, 32, 43);
  붓.textAlign = "right";
  붓.fillText(`남은 목숨: ${목숨}`, 너비 - 32, 43);

  for (const 한개 of 벽돌) {
    if (한개.남음) {
      붓.fillStyle = 한개.색;
      붓.fillRect(한개.x, 한개.y, 벽돌너비, 벽돌높이);
    }
  }

  붓.fillStyle = "#000000";
  붓.fillRect(막대.x, 막대.y, 막대.너비, 막대.높이);
  for (const 공 of 공들) 야구공그리기(공);

  const 안내 = {
    대기: "스페이스키를 눌러 시작하세요",
    "재시작 대기": "스페이스키를 눌러 계속하세요",
    승리: "승리! 스페이스키를 눌러 다시 시작하세요",
    종료: "게임 종료! 스페이스키를 눌러 다시 시작하세요"
  }[상태];
  if (안내) {
    붓.fillStyle = "rgba(255, 255, 255, 0.9)";
    붓.fillRect(180, 440, 664, 76);
    붓.fillStyle = "#000000";
    붓.font = "bold 25px Arial, 'Malgun Gothic', sans-serif";
    붓.textAlign = "center";
    붓.fillText(안내, 너비 / 2, 487);
  }
}

function 야구공그리기(공) {
  붓.save();
  붓.translate(공.x, 공.y);
  붓.rotate(공.회전);
  붓.fillStyle = "#FFFFFF";
  붓.strokeStyle = "#222222";
  붓.lineWidth = 1;
  붓.beginPath();
  붓.arc(0, 0, 공.반지름, 0, Math.PI * 2);
  붓.fill();
  붓.stroke();

  붓.strokeStyle = "#C62828";
  붓.lineWidth = 1.5;
  for (const 방향 of [-1, 1]) {
    붓.beginPath();
    붓.moveTo(방향 * 4, -7);
    붓.bezierCurveTo(방향 * 1, -3, 방향 * 1, 3, 방향 * 4, 7);
    붓.stroke();
    for (const y of [-4, 0, 4]) {
      붓.beginPath();
      붓.moveTo(방향 * 2.2, y - 1.3);
      붓.lineTo(방향 * 4.7, y + 1.3);
      붓.stroke();
    }
  }
  붓.restore();
}

function 반복(현재시간) {
  const 경과시간 = Math.min((현재시간 - 이전시간) / 1000, 0.025);
  이전시간 = 현재시간;
  움직이기(경과시간);
  그리기();
  requestAnimationFrame(반복);
}

document.addEventListener("keydown", (이벤트) => {
  if (["ArrowLeft", "ArrowRight", "Space"].includes(이벤트.code)) 이벤트.preventDefault();
  if (이벤트.code === "ArrowLeft") 누른키.왼쪽 = true;
  if (이벤트.code === "ArrowRight") 누른키.오른쪽 = true;
  if (이벤트.code === "Space" && !이벤트.repeat) {
    if (상태 === "승리" || 상태 === "종료") 새게임();
    else if (상태 !== "진행") 상태 = "진행";
  }
});

document.addEventListener("keyup", (이벤트) => {
  if (이벤트.code === "ArrowLeft") 누른키.왼쪽 = false;
  if (이벤트.code === "ArrowRight") 누른키.오른쪽 = false;
});

window.addEventListener("blur", () => {
  누른키.왼쪽 = false;
  누른키.오른쪽 = false;
});

벽돌만들기();
공놓기();
requestAnimationFrame(반복);
