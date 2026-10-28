// Second-stage "stuck" nudges: one line per room, shown only after many deaths or minutes in that room (and only
// with Settings → HINTS WHEN STUCK on). Each points at WHAT TO LOOK AT, never at the solution.
// [en, zh-TW, ja, ko, de, es, ru]
const N = {
  hall: ['EVERY NUMBER HERE COUNTS SOMETHING.', '這裡每個數字都在計算某件事。', 'ここの数字はどれも何かを数えている。', '여기 모든 숫자는 무언가를 센다.', 'JEDE ZAHL HIER ZÄHLT ETWAS.', 'CADA NÚMERO AQUÍ CUENTA ALGO.', 'КАЖДОЕ ЧИСЛО ЗДЕСЬ ЧТО-ТО СЧИТАЕТ.'],
  t1: ['WHAT DOES EACH GATE COUNT?', '每道門在數什麼？', 'それぞれの門は何を数えている？', '각 문은 무엇을 셀까?', 'WAS ZÄHLT JEDES TOR?', '¿QUÉ CUENTA CADA PUERTA?', 'ЧТО СЧИТАЕТ КАЖДАЯ ДВЕРЬ?'],
  t2: ['WATCH THE CUP WHILE YOU PRESS.', '按的時候看著那個杯子。', '押しながらカップを見て。', '누르면서 컵을 봐.', 'SIEH DIR DEN BECHER BEIM DRÜCKEN AN.', 'MIRA LA COPA MIENTRAS PULSAS.', 'СМОТРИ НА ЧАШУ, КОГДА ЖМЁШЬ.'],
  t3: ['A 1, AND A LOOSE BAR.', '一個 1，和一根鬆掉的橫槓。', '1 と、外れた棒が一本。', '1 하나, 그리고 빠진 막대 하나.', 'EINE 1 UND EIN LOSER STRICH.', 'UN 1 Y UNA BARRA SUELTA.', 'ЕДИНИЦА И ОДНА ЛИШНЯЯ ПАЛОЧКА.'],
  t4: ['THE GATE COUNTS SOMETHING YOU DO A LOT.', '這道門在數你常做的事。', 'この門はあなたがよくすることを数えている。', '이 문은 네가 자주 하는 것을 센다.', 'DAS TOR ZÄHLT ETWAS, DAS DU OFT TUST.', 'LA PUERTA CUENTA ALGO QUE HACES MUCHO.', 'ДВЕРЬ СЧИТАЕТ ТО, ЧТО ТЫ ДЕЛАЕШЬ ЧАСТО.'],
  c1: ['THE GATE KEEPS TIME.', '這道門在計時。', 'この門は時を刻んでいる。', '이 문은 시간을 잰다.', 'DAS TOR GEHT MIT DER ZEIT.', 'LA PUERTA LLEVA EL TIEMPO.', 'ДВЕРЬ ОТСЧИТЫВАЕТ ВРЕМЯ.'],
  c2: ['WHAT HAPPENS IF YOU DO NOTHING?', '如果你什麼都不做呢？', '何もしなかったらどうなる？', '아무것도 안 하면 어떻게 될까?', 'WAS PASSIERT, WENN DU NICHTS TUST?', '¿QUÉ PASA SI NO HACES NADA?', 'А ЕСЛИ НИЧЕГО НЕ ДЕЛАТЬ?'],
  c3: ['THE FLOOR UNDER YOU IS A KNOB.', '你腳下的地板是個旋鈕。', '足元の床はつまみだ。', '발밑의 바닥은 다이얼이다.', 'DER BODEN UNTER DIR IST EIN DREHKNOPF.', 'EL SUELO BAJO TUS PIES ES UNA PERILLA.', 'ПОЛ ПОД ТОБОЙ — ЭТО РУЧКА.'],
  c4: ['THIS DIGIT IS WIRED TO ANOTHER ROOM.', '這個數字連到另一個房間。', 'この数字は別の部屋につながっている。', '이 숫자는 다른 방과 연결되어 있다.', 'DIESE ZIFFER HÄNGT AN EINEM ANDEREN RAUM.', 'ESTE DÍGITO ESTÁ CONECTADO A OTRA SALA.', 'ЭТА ЦИФРА СВЯЗАНА С ДРУГОЙ КОМНАТОЙ.'],
  o1: ['THE BRIDGES KNOW WHERE YOU STAND.', '這些橋知道你站在哪裡。', '橋はあなたの立ち位置を知っている。', '다리는 네가 서 있는 곳을 안다.', 'DIE BRÜCKEN WISSEN, WO DU STEHST.', 'LOS PUENTES SABEN DÓNDE ESTÁS.', 'МОСТЫ ЗНАЮТ, ГДЕ ТЫ СТОИШЬ.'],
  o2: ['THE SWITCH REWIRES MORE THAN THIS ROOM.', '開關改接的不只這個房間。', 'スイッチはこの部屋以外もつなぎ替える。', '스위치는 이 방 말고도 바꾼다.', 'DER SCHALTER VERDRAHTET MEHR ALS DIESEN RAUM.', 'EL INTERRUPTOR CAMBIA MÁS QUE ESTA SALA.', 'ПЕРЕКЛЮЧАТЕЛЬ МЕНЯЕТ НЕ ТОЛЬКО ЭТУ КОМНАТУ.'],
  o3: ['THE BAR COUNTS SOMETHING YOU DO.', '這條長條在數你做的某件事。', 'このバーはあなたの行動を数えている。', '이 막대는 네 행동을 센다.', 'DER BALKEN ZÄHLT ETWAS, DAS DU TUST.', 'LA BARRA CUENTA ALGO QUE HACES.', 'ПОЛОСА СЧИТАЕТ ТО, ЧТО ТЫ ДЕЛАЕШЬ.'],
  p1: ['THE LONG FLOOR IS A KNOB TOO.', '那條長長的地板也是旋鈕。', '長い床もつまみだ。', '긴 바닥도 다이얼이다.', 'AUCH DER LANGE BODEN IST EIN DREHKNOPF.', 'EL SUELO LARGO TAMBIÉN ES UNA PERILLA.', 'ДЛИННЫЙ ПОЛ — ТОЖЕ РУЧКА.'],
  p2: ['OLD MARKS GLOW WHEN IT IS BRIGHT.', '夠亮的時候，舊的痕跡會發光。', '明るいと古い跡が光る。', '밝으면 오래된 자국이 빛난다.', 'ALTE SPUREN LEUCHTEN, WENN ES HELL IST.', 'LAS MARCAS VIEJAS BRILLAN SI HAY LUZ.', 'СТАРЫЕ СЛЕДЫ СВЕТЯТСЯ, КОГДА ЯРКО.'],
  p3: ['YOUR OWN HUD IS IN THE ROOM.', '你自己的 HUD 就在房間裡。', 'あなたの HUD が部屋の中にある。', '네 HUD가 방 안에 있다.', 'DEIN EIGENES HUD IST IM RAUM.', 'TU PROPIO HUD ESTÁ EN LA SALA.', 'ТВОЙ HUD — ЧАСТЬ КОМНАТЫ.'],
  l1: ['THE LETTERS ARE THE WALLS.', '字母就是牆。', '文字が壁だ。', '글자가 벽이다.', 'DIE BUCHSTABEN SIND DIE WÄNDE.', 'LAS LETRAS SON LAS PAREDES.', 'БУКВЫ — ЭТО СТЕНЫ.'],
  l2: ['COUNT THE LETTERS ON THE SIGN.', '數一數招牌上的字。', '看板の文字を数えて。', '표지판의 글자를 세어 봐.', 'ZÄHL DIE BUCHSTABEN AUF DEM SCHILD.', 'CUENTA LAS LETRAS DEL LETRERO.', 'ПОСЧИТАЙ БУКВЫ НА ТАБЛИЧКЕ.'],
  l3: ['TWO WORDS, TWO GATES.', '兩個詞，兩道門。', '二つの言葉、二つの門。', '두 단어, 두 문.', 'ZWEI WÖRTER, ZWEI TORE.', 'DOS PALABRAS, DOS PUERTAS.', 'ДВА СЛОВА — ДВЕ ДВЕРИ.'],
  c5: ['THE SIGN CHANGES ON A BEAT.', '招牌照著節拍變換。', '看板は拍子に合わせて変わる。', '표지판은 박자에 맞춰 바뀐다.', 'DAS SCHILD WECHSELT IM TAKT.', 'EL LETRERO CAMBIA AL COMPÁS.', 'ТАБЛИЧКА МЕНЯЕТСЯ В ТАКТ.'],
  p4: ['READ THE ROOM\'S NAME.', '讀一讀這個房間的名字。', '部屋の名前を読んで。', '방 이름을 읽어 봐.', 'LIES DEN NAMEN DES RAUMS.', 'LEE EL NOMBRE DE LA SALA.', 'ПРОЧТИ НАЗВАНИЕ КОМНАТЫ.'],
  o4: ['THE MAP SHOWS A ROOM YOU HAVE NOT FOUND.', '地圖上有一個你還沒找到的房間。', '地図にはまだ見つけていない部屋がある。', '지도에 아직 못 찾은 방이 있다.', 'DIE KARTE ZEIGT EINEN RAUM, DEN DU NICHT KENNST.', 'EL MAPA MUESTRA UNA SALA QUE NO HAS ENCONTRADO.', 'НА КАРТЕ ЕСТЬ КОМНАТА, КОТОРУЮ ТЫ НЕ НАШЁЛ.'],
  s1: ['THE GOLD STRIPE RUNS A LONG WAY.', '金色的線拉得很遠。', '金色の線は遠くまで続いている。', '금색 줄은 멀리까지 이어진다.', 'DER GOLDENE STREIFEN REICHT WEIT.', 'LA FRANJA DORADA LLEGA LEJOS.', 'ЗОЛОТАЯ ПОЛОСА ТЯНЕТСЯ ДАЛЕКО.'],
  x1: ['THE HUD IS ALWAYS IN THE WAY. ALWAYS?', 'HUD 總是擋路。總是嗎？', 'HUD はいつも邪魔だ。いつも？', 'HUD는 늘 길을 막는다. 늘?', 'DAS HUD IST IMMER IM WEG. IMMER?', 'EL HUD SIEMPRE ESTORBA. ¿SIEMPRE?', 'HUD ВСЕГДА МЕШАЕТ. ВСЕГДА?'],
  x2: ['WHOSE TIME IS THIS?', '這是誰的時間？', 'これは誰の時間？', '이건 누구의 시간일까?', 'WESSEN ZEIT IST DAS?', '¿DE QUIÉN ES ESTA HORA?', 'ЧЬЁ ЭТО ВРЕМЯ?'],
  y1: ['THE WALL IS AS LOUD AS THE MUSIC.', '這面牆跟音樂一樣大聲。', 'この壁は音楽と同じ大きさだ。', '이 벽은 음악만큼 크다.', 'DIE WAND IST SO LAUT WIE DIE MUSIK.', 'EL MURO ES TAN ALTO COMO LA MÚSICA.', 'СТЕНА ГРОМКАЯ, КАК МУЗЫКА.'],
  a1: ['THE SIGN ONLY SHOWS OFF WHILE YOU KEEP STILL.', '你不動的時候，招牌才會表演。', 'じっとしている間だけ看板は見せびらかす。', '가만히 있을 때만 표지판이 뽐낸다.', 'DAS SCHILD ZEIGT SICH NUR, WENN DU STILLHÄLTST.', 'EL LETRERO SOLO PRESUME SI TE QUEDAS QUIETO.', 'ТАБЛИЧКА КРАСУЕТСЯ, ТОЛЬКО ПОКА ТЫ СТОИШЬ.'],
  n1: ['THE SOLID ROOMS ARE ONES YOU HAVE NOT SEEN.', '實心的房間是你還沒去過的。', '固い部屋はまだ見ていない部屋だ。', '단단한 방은 아직 못 본 방이다.', 'FEST SIND DIE RÄUME, DIE DU NICHT KENNST.', 'LAS SALAS SÓLIDAS SON LAS QUE NO HAS VISTO.', 'ТВЁРДЫЕ — ЭТО КОМНАТЫ, ГДЕ ТЫ НЕ БЫЛ.'],
  e1: ['EVERYTHING YOU KNOW, ONCE MORE.', '你學過的一切，再來一次。', '知っていることを、もう一度全部。', '아는 것 전부, 한 번 더.', 'ALLES, WAS DU WEISST, NOCH EINMAL.', 'TODO LO QUE SABES, UNA VEZ MÁS.', 'ВСЁ, ЧТО ТЫ ЗНАЕШЬ, ЕЩЁ РАЗ.'],
  i1: ['THESE NUMBERS NEVER MOVE WHILE YOU PLAY.', '你在玩的時候，這些數字從不動。', 'プレイ中はこの数字は動かない。', '플레이하는 동안 이 숫자는 안 움직인다.', 'DIESE ZAHLEN BEWEGEN SICH NIE, WÄHREND DU SPIELST.', 'ESTOS NÚMEROS NO SE MUEVEN MIENTRAS JUEGAS.', 'ЭТИ ЧИСЛА НЕ МЕНЯЮТСЯ, ПОКА ТЫ ИГРАЕШЬ.'],
  fu: ['THE FLOOR IS A NUMBER. THE CEILING IS A DOOR.', '地板是一個數字。天花板是一扇門。', '床は数字。天井は扉。', '바닥은 숫자. 천장은 문.', 'DER BODEN IST EINE ZAHL. DIE DECKE EINE TÜR.', 'EL SUELO ES UN NÚMERO. EL TECHO, UNA PUERTA.', 'ПОЛ — ЭТО ЧИСЛО. ПОТОЛОК — ДВЕРЬ.'],
  pv: ['WHERE DOES A NUMBER END?', '一個數字在哪裡結束？', '数はどこで終わる？', '숫자는 어디서 끝날까?', 'WO ENDET EINE ZAHL?', '¿DÓNDE TERMINA UN NÚMERO?', 'ГДЕ КОНЧАЕТСЯ ЧИСЛО?'],
  lp: ['THE ROOM COUNTS ITS VISITORS.', '這個房間會數訪客。', 'この部屋は訪問者を数える。', '이 방은 방문객을 센다.', 'DER RAUM ZÄHLT SEINE BESUCHER.', 'LA SALA CUENTA SUS VISITAS.', 'КОМНАТА СЧИТАЕТ ГОСТЕЙ.'],
};
const ORDER = ['en', 'zh-TW', 'ja', 'ko', 'de', 'es', 'ru'];
export const NUDGES = N;
export function nudgeFor(roomId, lang) {
  const row = N[roomId];
  return row ? row[Math.max(0, ORDER.indexOf(lang))] || row[0] : null;
}
