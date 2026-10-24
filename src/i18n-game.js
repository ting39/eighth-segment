// Eighth Segment translations. Every on-screen string passes through R.text(), which calls tr():
// exact English (upper case) → translation, then regex patterns for strings with numbers.
const D = {
  'zh-TW': {
    // menus
    'CONTINUE': '繼續', 'NEW GAME': '新遊戲', 'START': '開始', 'SETTINGS': '設定', 'MORE BY TING39': 'ting39 的其他作品',
    'PLAY THE ORIGINAL (V1)': '玩原始版（V1）', 'PLAY THE REDESIGN (V2)': '玩改版（V2）', 'ERASE THE CURRENT RUN?': '要刪除目前的進度嗎？',
    'NO': '否', 'YES': '是', 'PAUSED': '暫停', 'RESUME': '繼續', 'MAP': '地圖', 'RESTART ROOM': '重新開始房間',
    'SAVE & QUIT TO TITLE': '存檔並回到標題', 'MUSIC VOLUME': '音樂音量', 'SOUND VOLUME': '音效音量', 'BRIGHTNESS': '亮度',
    'HUD POSITION': 'HUD 位置', 'GAME SPEED': '遊戲速度', 'GLOW': '光暈', 'SCREEN SHAKE': '畫面震動', 'FLASHES': '閃光',
    'HUD (TIME/DEATHS)': 'HUD（時間/死亡）', 'HINTS WHEN STUCK': '卡關時提示', 'TOUCH BUTTONS': '觸控按鈕',
    'RESET KEYS': '重設按鍵', 'BACK': '返回', 'LANGUAGE': '語言', 'ON': '開', 'OFF': '關', 'AUTO': '自動', 'TOP': '上方', 'BOTTOM': '下方',
    'PRESS A KEY': '請按一個鍵', 'KEY LEFT': '左鍵', 'KEY RIGHT': '右鍵', 'KEY JUMP': '跳躍鍵', 'KEY RESTART': '重來鍵',
    // title / prompts
    'YOU ARE THE DECIMAL POINT.': '你是小數點。', 'TAP JUMP TO SELECT': '按跳躍鍵選擇', 'A TO SELECT': '按 A 選擇', 'ARROWS + Z/SPACE': '方向鍵 + Z/空白鍵',
    'STICK MOVE   A JUMP': '搖桿移動   A 跳躍', 'ARROWS MOVE   Z / SPACE JUMP': '方向鍵移動   Z/空白鍵跳躍', 'PRESS JUMP': '按跳躍鍵',
    // regions
    'BOOT': '開機', 'TALLY': '計數', 'CLOCKWORK': '鐘錶', 'COORDINATES': '座標', 'OVERFLOW': '溢位', 'MASTER READOUT': '主顯示器', 'PANEL': '面板',
    // rooms (v1)
    'THE TITLE': '標題畫面', 'WAKE': '甦醒', 'LIT IS SOLID': '亮的是實體', 'CORNERS': '轉角', 'UPWARD': '向上', 'SPARE': '備用', 'HOP COUNT': '跳躍次數',
    'MIND YOUR HEAD': '小心頭頂', 'JUNCTION': '交會點', 'TICK': '滴答', 'PATIENCE': '耐心', 'WHERE YOU ARE': '你在哪裡', 'BITS': '位元',
    'STAND STILL': '站著別動', 'TURN IT UP': '開大聲', 'FINE PRINT': '小字', 'ENCORE': '安可', 'TWO CLOCKS': '兩個時鐘', 'STILLER': '更靜止',
    'WHERE TO FALL': '往哪裡掉', 'COUNTING IN TWOS': '二進位計數', 'MIND THE GAPS': '小心縫隙', 'DESCENT': '下降', 'LOW CEILING': '低天花板',
    'BACK DOOR': '後門', 'PAST NINE': '超過九', 'MIXING DESK': '混音台', 'EVERYTHING AT ONCE': '全部一起來', 'NOTCHES': '刻痕',
    'OVERTIME': '加時', 'SIDE CHANNEL': '旁路', 'EVERY OTHER': '每隔一個',
    // rooms (v2)
    'THE DISPLAY HALL': '顯示大廳', 'PRESS': '按壓', 'LOOSE': '鬆脫', 'CARRY HOME': '帶回家', 'STILL': '靜止', 'DIAL': '旋鈕',
    'TIMED DIAL': '計時旋鈕', 'BELOW': '下方', 'REWIRE': '重新接線', 'WHERE AND WHEN': '何處與何時', 'DIMMER': '調光器', 'BURN-IN': '烙印', 'STATUS BAR': '狀態列',
    // signs
    'LOCAL TIME': '當地時間', 'C / D': 'C / D', 'PUT THE POINT WHERE IT BELONGS': '把小數點放回它該在的地方',
    'HUD POSITION: BOTTOM': 'HUD 位置：下方', 'THE HALL WANTS IT DARK': '大廳想要暗一點',
    // endings
    'TEN TIMES TOO MUCH': '多了十倍', 'TEN TIMES TOO LITTLE': '少了十倍', 'THE EIGHTH SEGMENT': '第八段',
    'YOU SETTLE INTO THE WRONG PLACE.': '你落進了錯誤的位置。', 'THE READOUT GLOWS, CONFIDENT AND WRONG.': '顯示器亮了起來，自信滿滿，卻是錯的。',
    'NOBODY NOTICES. NOTHING IS QUITE RIGHT.': '沒人發現。一切都不太對。', 'THE MACHINE HUMS A LITTLE QUIETER.': '機器的嗡嗡聲變小了一點。',
    'SOMETHING, SOMEWHERE, RUNS SHORT.': '某處的某樣東西不夠了。', 'THE NUMBER IS WHOLE AGAIN.': '這個數字又完整了。',
    'EVERY DISPLAY IN THE MACHINE FLICKERS ONCE,': '機器裡的每一個顯示器閃了一下，', 'AND READS TRUE.': '顯示出正確的數字。',
    'ONE PERCENT': '百分之一', 'TEN PERCENT': '百分之十', 'ONE HUNDRED PERCENT': '百分之百',
    'THE READOUT SAYS 1.00000 %.': '顯示器寫著 1.00000 %。', 'THE MACHINE SHRUGS. THE POINT POPS BACK OUT.': '機器聳聳肩。小數點又彈了出來。',
    'THE READOUT SAYS 10.0000 %.': '顯示器寫著 10.0000 %。', 'CLOSER. SOMETHING IS STILL MISSING.': '更近了。還少了點什麼。',
    'EVERY NUMBER IN THE MACHINE READS TRUE.': '機器裡的每個數字都正確了。', 'THE POINT POPS BACK OUT.': '小數點又彈了出來。',
  },
  ja: {
    'CONTINUE': 'つづきから', 'NEW GAME': 'はじめから', 'START': 'スタート', 'SETTINGS': '設定', 'MORE BY TING39': 'ting39 のほかの作品',
    'PLAY THE ORIGINAL (V1)': 'オリジナル版（V1）', 'PLAY THE REDESIGN (V2)': 'リデザイン版（V2）', 'ERASE THE CURRENT RUN?': '現在の進行を消去しますか？',
    'NO': 'いいえ', 'YES': 'はい', 'PAUSED': 'ポーズ', 'RESUME': 'つづける', 'MAP': 'マップ', 'RESTART ROOM': '部屋をやり直す',
    'SAVE & QUIT TO TITLE': 'セーブしてタイトルへ', 'MUSIC VOLUME': '音楽の音量', 'SOUND VOLUME': '効果音の音量', 'BRIGHTNESS': '明るさ',
    'HUD POSITION': 'HUD の位置', 'GAME SPEED': 'ゲーム速度', 'GLOW': 'グロー', 'SCREEN SHAKE': '画面の揺れ', 'FLASHES': 'フラッシュ',
    'HUD (TIME/DEATHS)': 'HUD（時間/ミス）', 'HINTS WHEN STUCK': '詰まったらヒント', 'TOUCH BUTTONS': 'タッチボタン',
    'RESET KEYS': 'キー設定を戻す', 'BACK': 'もどる', 'LANGUAGE': '言語', 'ON': 'オン', 'OFF': 'オフ', 'AUTO': '自動', 'TOP': '上', 'BOTTOM': '下',
    'PRESS A KEY': 'キーを押してください', 'KEY LEFT': '左キー', 'KEY RIGHT': '右キー', 'KEY JUMP': 'ジャンプキー', 'KEY RESTART': 'やり直しキー',
    'YOU ARE THE DECIMAL POINT.': 'あなたは小数点。', 'TAP JUMP TO SELECT': 'ジャンプで決定', 'A TO SELECT': 'A で決定', 'ARROWS + Z/SPACE': '矢印キー + Z/スペース',
    'STICK MOVE   A JUMP': 'スティックで移動   A でジャンプ', 'ARROWS MOVE   Z / SPACE JUMP': '矢印キーで移動   Z/スペースでジャンプ', 'PRESS JUMP': 'ジャンプを押す',
    'BOOT': '起動', 'TALLY': '計数', 'CLOCKWORK': '時計仕掛け', 'COORDINATES': '座標', 'OVERFLOW': 'オーバーフロー', 'MASTER READOUT': 'メイン表示器', 'PANEL': 'パネル',
    'THE TITLE': 'タイトル', 'WAKE': '目覚め', 'LIT IS SOLID': '光るものは足場', 'CORNERS': '角', 'UPWARD': '上へ', 'SPARE': '予備', 'HOP COUNT': 'ジャンプ回数',
    'MIND YOUR HEAD': '頭上注意', 'JUNCTION': '分岐点', 'TICK': 'チクタク', 'PATIENCE': '忍耐', 'WHERE YOU ARE': '現在地', 'BITS': 'ビット',
    'STAND STILL': '動かないで', 'TURN IT UP': '音量を上げろ', 'FINE PRINT': '小さな文字', 'ENCORE': 'アンコール', 'TWO CLOCKS': '2 つの時計', 'STILLER': 'もっと静かに',
    'WHERE TO FALL': 'どこに落ちるか', 'COUNTING IN TWOS': '2 進数で数える', 'MIND THE GAPS': '隙間に注意', 'DESCENT': '降下', 'LOW CEILING': '低い天井',
    'BACK DOOR': '裏口', 'PAST NINE': '9 の先', 'MIXING DESK': 'ミキサー卓', 'EVERYTHING AT ONCE': '全部いっぺんに', 'NOTCHES': '刻み目',
    'OVERTIME': '延長戦', 'SIDE CHANNEL': 'サイドチャンネル', 'EVERY OTHER': '1 つおき',
    'THE DISPLAY HALL': 'ディスプレイホール', 'PRESS': '押す', 'LOOSE': '外れた部品', 'CARRY HOME': '持ち帰る', 'STILL': '静止', 'DIAL': 'ダイヤル',
    'TIMED DIAL': '時限ダイヤル', 'BELOW': '下', 'REWIRE': '配線し直す', 'WHERE AND WHEN': 'どこでいつ', 'DIMMER': '調光器', 'BURN-IN': '焼き付き', 'STATUS BAR': 'ステータスバー',
    'LOCAL TIME': '現地時刻', 'C / D': 'C / D', 'PUT THE POINT WHERE IT BELONGS': '小数点をあるべき場所へ',
    'HUD POSITION: BOTTOM': 'HUD の位置：下', 'THE HALL WANTS IT DARK': 'ホールは暗さを求めている',
    'TEN TIMES TOO MUCH': '10 倍多すぎる', 'TEN TIMES TOO LITTLE': '10 分の 1 しかない', 'THE EIGHTH SEGMENT': '8 番目のセグメント',
    'YOU SETTLE INTO THE WRONG PLACE.': 'あなたは間違った場所に収まった。', 'THE READOUT GLOWS, CONFIDENT AND WRONG.': '表示器は自信たっぷりに、間違った数字を光らせる。',
    'NOBODY NOTICES. NOTHING IS QUITE RIGHT.': '誰も気づかない。何もかもが少しずれている。', 'THE MACHINE HUMS A LITTLE QUIETER.': '機械のうなりが少し静かになった。',
    'SOMETHING, SOMEWHERE, RUNS SHORT.': 'どこかで、何かが足りなくなる。', 'THE NUMBER IS WHOLE AGAIN.': '数字はふたたび完全になった。',
    'EVERY DISPLAY IN THE MACHINE FLICKERS ONCE,': '機械の中のすべての表示器が一度だけまたたき、', 'AND READS TRUE.': '正しい数字を映した。',
    'ONE PERCENT': '1 パーセント', 'TEN PERCENT': '10 パーセント', 'ONE HUNDRED PERCENT': '100 パーセント',
    'THE READOUT SAYS 1.00000 %.': '表示器は 1.00000 % を示している。', 'THE MACHINE SHRUGS. THE POINT POPS BACK OUT.': '機械は肩をすくめた。小数点がはじき出された。',
    'THE READOUT SAYS 10.0000 %.': '表示器は 10.0000 % を示している。', 'CLOSER. SOMETHING IS STILL MISSING.': '近づいた。まだ何かが足りない。',
    'EVERY NUMBER IN THE MACHINE READS TRUE.': '機械の中のすべての数字が正しくなった。', 'THE POINT POPS BACK OUT.': '小数点がはじき出された。',
  },
};
// patterns for strings that contain numbers
const P = {
  'zh-TW': [
    [/^TIME (.+)$/, '時間 $1'], [/^DEATHS (\d+)   JUMPS (\d+)$/, '死亡 $1   跳躍 $2'], [/^STRAY POINTS (\d+)\/(\d+)$/, '散落的小數點 $1/$2'],
    [/^ENDING (\d+) OF (\d+)   \(ASSISTED SPEED\)$/, '結局 $1/$2   （調整過速度）'], [/^ENDING (\d+) OF (\d+)$/, '結局 $1/$2'],
    [/^CLEARS (\d+)  BEST (\S+)  ENDINGS (\d+)\/(\d+)$/, '破關 $1  最佳 $2  結局 $3/$4'], [/^POINTS (\d+)$/, '小數點 $1'],
    [/^(\d+) DIGITS? STILL DARK\. STRAY POINTS LIGHT THEM\.$/, '還有 $1 個數字是暗的。散落的小數點能點亮它們。'],
  ],
  ja: [
    [/^TIME (.+)$/, 'タイム $1'], [/^DEATHS (\d+)   JUMPS (\d+)$/, 'ミス $1   ジャンプ $2'], [/^STRAY POINTS (\d+)\/(\d+)$/, '迷子の小数点 $1/$2'],
    [/^ENDING (\d+) OF (\d+)   \(ASSISTED SPEED\)$/, 'エンディング $1/$2   （速度調整あり）'], [/^ENDING (\d+) OF (\d+)$/, 'エンディング $1/$2'],
    [/^CLEARS (\d+)  BEST (\S+)  ENDINGS (\d+)\/(\d+)$/, 'クリア $1  ベスト $2  エンディング $3/$4'], [/^POINTS (\d+)$/, '小数点 $1'],
    [/^(\d+) DIGITS? STILL DARK\. STRAY POINTS LIGHT THEM\.$/, 'まだ $1 桁が暗いまま。迷子の小数点が明かりをともす。'],
  ],
};
const lang = () => (globalThis.I18N ? globalThis.I18N.lang : 'en');
export function tr(s) {
  const l = lang();
  if (l === 'en' || !D[l]) return s;
  s = String(s);
  if (D[l][s] != null) return D[l][s];
  for (const [re, t] of P[l]) if (re.test(s)) return s.replace(re, t);
  return s;
}
export const LANG_LABEL = { en: 'ENGLISH', 'zh-TW': '中文', ja: '日本語' };
