let nav_items = [
  {link:"/",title:"Home"},
  {link:"/projects",title:"Projects"},
  {link:"/methods",title:"Methods"},
  {link:"/contact",title:"Contact"}
]
let dom = {};


let fly_path = {
  columns: 12,
  points: []
}


window.onload = init;

function init() {
  dom.main = document.querySelector('main');
  dom.nav = dom.main.querySelector('nav');
  dom.article = dom.main.querySelector('article');
  window.addEventListener('resize',handle_resize);
  document.querySelector('#toggle-nav').addEventListener('click',toggle_menu);
  
  // 'stretch-line'
  generate_fly_path();
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
  dom.nav.style.setProperty('--cols', fly_path.columns);
  fly_path.points.push({ x: fly_path.columns, y: 0 });
  switch (algorithm) {
    case 'step-by-step':
      
      let min_distance = 4;
      // let crosshair={x:6,y:0};
      let n = Math.max(10, nav_items.length);
      let forwards = false;
      for (let i = 0; i < n; i++) {
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
        let increment=2;
        for(let i=1;i<=20;i++){
          let remainder = i % (fly_path.columns);
          let x=remainder;

          fly_path.points.push({
            x,
            y:i
          })

        }


        break;
  }

  let col=100/12;
  let row=col/4;

  let polyline_points=fly_path.points.map((a)=>`${a.x * col},${a.y * row}`).join(' ');
  let offset_path_points=fly_path.points.map((a)=>`${a.x * col}% ${a.y * col}%`).join(',');
  document.querySelector('#fly-path').setAttribute('viewBox',`0 0 100 ${fly_path.points.at(-1).y*row}`);
  let polyline=document.querySelector('#fly-path polyline');
  
  document.querySelector('#fly').style.setProperty('offset-path',`polygon(${offset_path_points})`);
  
  polyline.setAttribute('points',polyline_points);
  let polyline_length=polyline.getTotalLength();
  document.querySelector('#fly-path').style.setProperty('--l',polyline_length);
  // console.log('fly_path.points', fly_path.points);

  for(let i =1; i<fly_path.points.length;i++){
    let segment=generate_segment(fly_path.points[i-1], fly_path.points[i]);
    let item=nav_items[i-1]
    segment.style.setProperty('--i', i);;
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