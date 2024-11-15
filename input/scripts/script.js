console.log(base_url)

let nav_items = [
  {link:base_url,title:"Home"},
  {link:base_url+"projects",title:"Projects"},
  {link:base_url+"methods",title:"Methods"},
  {link:base_url+"contact",title:"Contact"}
]
let dom = {};

// fly path related variables
let fly_path = {
  columns: 12,
  points: []
}

let polyline_length=0;
let svg_box_height=100;


window.onload = init;

function init() {
  dom.main = document.querySelector('main');
  dom.nav = dom.main.querySelector('nav');
  dom.article = dom.main.querySelector('article');
  window.addEventListener('resize',handle_resize);
  document.querySelector('#toggle-nav').addEventListener('click',toggle_menu);
  
  // fly path setup
  generate_fly_path();
  render_fly_path();
  buzz(false)
  setTimeout(()=>{
    buzz();
  },500)
  
  // type
  optical_align_headers()
  dom.main.classList.add('mounted');

}


function optical_align_headers(){
  let headers=document.querySelectorAll('h2');
  let match_list=[`“`,`”`,`‘`,`’`,'(',')'];

  for(let header of headers){
    if(match_list.includes(header.innerText[0])){
      header.innerHTML=header.innerHTML.replace(header.innerText[0],`<span class="optical-align">${header.innerText[0]}</span>`);
    }
  }
}

function toggle_menu(){
  let old_state=dom.main.dataset.menu_open === 'true';
  let open=!old_state;
  dom.main.dataset.menu_open=open;
  dom.nav.setAttribute('aria-hidden',!open)
  dom.article.setAttribute('aria-hidden',open);
}


function handle_resize(){
  // https://stackoverflow.com/a/57748743
  let scrollbar_width=window.innerWidth - document.documentElement.clientWidth;
  document.documentElement.style.setProperty('--scrollbar-width', scrollbar_width + "px");
}





function generate_fly_path(algorithm = 'step-by-step') {
  const page={w:window.innerWidth,h:document.documentElement.scrollHeight};
  let row_height=(page.w/fly_path.columns)/4;
  const max_y=Math.ceil(page.h/row_height);
  console.log('max_y',max_y,page.h);


  dom.nav.style.setProperty('--cols', fly_path.columns);
  fly_path.points.push({ x: fly_path.columns, y: 0 });
  switch (algorithm) {
    case 'step-by-step':
      
      let min_distance = 4;
      // let crosshair={x:6,y:0};
      let n = Math.max(10, nav_items.length);
      let forwards = false;

      let keep_generating=(i)=>{
        return i<1 || (fly_path.points.at(-1).y<max_y);
      }


      for (let i = 0; keep_generating(i); i++) {
        let crosshair = { ...fly_path.points.at(-1) };
        let space_before = forwards ? [] : Math.max(0, crosshair.x - min_distance + 1);
        let space_after = forwards ? Math.max(0, fly_path.columns + 1 - (crosshair.x + min_distance)) : [];
        let choices_for_x = [];
        for (let i = 0; i < space_before; i++) choices_for_x.push(crosshair.x - (min_distance + i));
        for (let i = 0; i < space_after; i++) choices_for_x.push(crosshair.x + (min_distance + i));
        let x = choices_for_x[Math.floor(Math.random() * choices_for_x.length)];
        let point = { x, y: crosshair.y + Math.abs(crosshair.x - x) };
        fly_path.points.push(point);
        forwards = !forwards;

      }

      
      break;
      case 'stretch-line':
        // leaving for now
      break;
  }
}



function render_fly_path(){
  const col=100/12;
  const row=col/4;

  // generate svg polyline points from provided fly points
  const polyline_points=fly_path.points.map((a)=>`${a.x * col},${a.y * row}`).join(' ');

  // generate path for css offset-path of fly animation
  svg_box_height=fly_path.points.at(-1).y*row;
  document.querySelector('#fly-path').setAttribute('viewBox',`0 0 100 ${svg_box_height}`);
  dom.polyline=document.querySelector('#fly-path polyline');
  dom.fly=document.querySelector('#fly');
  

  
  // document.querySelector('#fly').style.setProperty('offset-path',`polygon(${offset_path_points})`);
  
  dom.polyline.setAttribute('points',polyline_points);
  polyline_length=dom.polyline.getTotalLength();
  document.querySelector('#fly-path').style.setProperty('--l',polyline_length);
  document.querySelector('#fly-path-wrapper').style.setProperty('--h-w-ratio',svg_box_height / 100);


  for(let i =1; i<fly_path.points.length;i++){
    
    let item=nav_items[i-1]
    let segment=generate_segment(fly_path.points[i-1], fly_path.points[i]);
    segment.style.setProperty('--i', i);
    if(item){
      let link=document.createElement('a');
      link.classList.add('menu-link')
      link.classList.add('pantasia-large');
      link.innerText=item.title;
      link.href=item.link;
      segment.appendChild(link);
    }
  }
}


function generate_segment(start = { x: 0, y: 0 }, end = { x: 0, y: 0 }) {
  let x_sorted_ascending = [start.x, end.x].sort((a, b) => a - b);
  let div = document.createElement('div');
  div.style.setProperty('--start-x', x_sorted_ascending[0] + 1);
  div.style.setProperty('--end-x', x_sorted_ascending[1] + 1);
  div.style.setProperty('--start-y', start.y + 1);
  div.style.setProperty('--end-y', end.y + 1);
  div.classList.add('segment');

  div.dataset.direction=start.x < end.x?"right":"left";

  dom.nav.appendChild(div);

  return div;
}

// animation timing variables
let buzz_mode=false;
let buzz_pos=0;

// 10,000ms -> 10s
let full_duration=10 * 1000;
let full_distance=1;
let flight={
  current:{
    position:0
  },
  start:{
    position:0,
    time:0
  },
  end:{
    position:1,
  },
  duration:1,
  distance:1
}

function buzz(v=true){
  buzz_mode=v;
  document.querySelector('#fly-path-wrapper').classList.toggle('buzz',v);
  flight.start.time=performance.now();
  flight.start.position=flight.current.position;
  flight.distance=flight.end.position - flight.start.position;
  flight.duration=(flight.distance/full_distance) * full_duration;
  
  position_fly();
}


function position_fly(){
  // animation timing logic
  let now=performance.now();
  let elapsed=now - flight.start.time;
  flight.current.position= flight.start.position + (elapsed / flight.duration) * flight.distance;
  
  // read point and render
  let path_point=dom.polyline.getPointAtLength(polyline_length * flight.current.position);
  let tangent_comparison=dom.polyline.getPointAtLength(polyline_length * (flight.current.position + 0.001));
  let tangent_angle=Math.atan2(tangent_comparison.y - path_point.y,tangent_comparison.x - path_point.x) - Math.PI/2;


  dom.fly.style.setProperty('--buzz-x-absolute',path_point.x/100);
  dom.fly.style.setProperty('--buzz-y-absolute',path_point.y/100);
  if(flight.current.position < 0.999) dom.fly.style.setProperty('--buzz-direction',tangent_angle+'rad');
  
  // console.log(path_point);
  // polyline_length

  if(buzz_mode && elapsed<flight.duration){
    requestAnimationFrame(position_fly);
  }
  // let pos=document.querySelector('#fly-path-wrapper .mask').getComputedStyle()
}