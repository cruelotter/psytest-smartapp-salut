import { Dialute, SberRequest } from 'dialute';
import e from 'express';
import { stat } from 'fs';
import { data } from './data';

const questions = data;

function* script(r: SberRequest) {
  const rsp = r.buildRsp();
  
  const state = {
    id: 0,
    e: 0,
    l: 0,
    n: 0,
    question: {},
    intro: false,
    done: false
  };

  function updateState(ans: any) {
    if (!(questions[state.id].options[ans].koe === undefined)) {
      state.e += Number(questions[state.id].options[ans].koe.e === undefined? '0' : questions[state.id].options[ans].koe.e);
      state.l += Number(questions[state.id].options[ans].koe.l === undefined? '0' : questions[state.id].options[ans].koe.l);
      state.n += Number(questions[state.id].options[ans].koe.n === undefined? '0' : questions[state.id].options[ans].koe.n);

    }

    state.intro = false;
    state.id += 1;
    state.question = questions[state.id]

    rsp.msg = questions[state.id].texts;
    rsp.msgJ = questions[state.id].textj;
    rsp.data = state;
  }

  function startState() {
    state.intro = true;
    state.question = questions[0]
    rsp.data = state;
  }

  startState();
  rsp.msg = 'Добро пожаловать!';
  rsp.msgJ = 'Привет!';
  yield rsp;

  while (state.id <= 56){
    if (r.type === 'SERVER_ACTION'){
      console.log(r.act?.action_id)
      if (r.act?.action_id == 'click'){

        if (r.act.data != -1) updateState(r.act.data);
        else {
          rsp.msg = 'Всего вам доброго!';
          rsp.msgJ = 'Еще увидимся. Пока!';
          rsp.end = true;
          rsp.data = {'type': 'close_app'}
        }
      }
      yield rsp;
      continue;
    }
   
    else if (r.nlu.lemmaIntersection(['выход', 'выйти', 'выйди'])) {
      rsp.msg = 'Всего вам доброго!';
      rsp.msgJ = 'Еще увидимся. Пока!';
      rsp.end = true;
      rsp.data = {'type': 'close_app'}
    }

    else if (r.nlu.lemmaIntersection(['да', 'согласен', 'да да']) || ['да', 'согласен', 'да да'].includes(r.msg.toLowerCase())) {
      updateState(0);
      yield rsp;
    }

    else if (r.nlu.lemmaIntersection(['нет', 'не согласен', 'сомневаюсь']) || ['нет', 'не согласен', 'сомневаюсь'].includes(r.msg.toLowerCase())) {
      updateState(1);
      yield rsp;
    }

    else if (r.nlu.lemmaIntersection(['возможно', 'не знаю']) || ['возможно', 'не знаю'].includes(r.msg.toLowerCase())) {
      updateState(2);
      yield rsp;
    }
  }
  rsp.msg = 'Поздравляю! Вы знаете все места Москвы!'
  rsp.msgJ = 'Поздравляю! Ты знаешь все места Москвы!'
  yield rsp;
}

Dialute
  .fromEntrypoint(script as GeneratorFunction)
  .shareApp('../app/public')
  .start();
