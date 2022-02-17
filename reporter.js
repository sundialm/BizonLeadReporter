let MAX_MINUTES = 90;
let MIN_MINUTES = 45;
const IGNORE_EMAILS = ["fakeemail@gmail.com"]
console.log("Start");

class Lead {
    constructor(username, email, phone, start_time, finish_time) {
        this.username = username;
        this.email = email;
        this.phone = phone;
        this.start_time = start_time;
        this.finish_time = finish_time;
        this.messages = [];
        this.isFinished = false;
        this.totalTime = 0;
        this.want_to_study = false;
    }

    toString() {
        return `${this.username} ${this.email}`;
    }

    equal(lead) {
        return (this.username === lead.username && this.email === lead.email) ||
            (this.username === lead.username && this.phone === lead.phone);
    }

    set_is_finished() {
        this.isFinished = this.calculateIsFinished();
    }

    calculateIsFinished() {
        let totalTime = (this.finish_time - this.start_time) / 60000
        this.totalTime = totalTime;
        return totalTime >= MAX_MINUTES;
    }

    get_date_of_webinar() {
        let date = document.getElementsByClassName('st-start')[0].innerText.split(',')[0];
        date = date.split('.');
        this.get_time_of_webinar()
        return `${date[2]}-${date[1]}-${date[0]}`;
    }

    get_time_of_webinar() {
        let time = document.getElementsByClassName('st-start')[0].innerText.split(',')[1];
        return time.trim();
    }

    set_start_dateTime() {
        let date = this.get_date_of_webinar();
        this.start_time = new Date(date + 'T' + this.start_time)
    }

    set_finish_dateTime() {
        if (this.finish_time === 'до конца') {
            let webinarCount = parseInt(document.getElementsByClassName('st-minutes')[0].innerText);
            let webinar_start = new Date(this.get_date_of_webinar() + 'T' + this.get_time_of_webinar());
            let webinar_finish = new Date(webinar_start.getTime() + webinarCount * 60000);
            let total_time = webinar_finish - this.start_time;
            this.finish_time = new Date(this.start_time.getTime() + total_time);
        } else {
            let date = this.get_date_of_webinar();
            this.finish_time = new Date(date + 'T' + this.finish_time)
        }
    }

    recalculate_finish_time(minutes) {
        this.finish_time = new Date(this.finish_time.getTime() + minutes * 60000);
        this.calculateIsFinished();
    }

// с конца начать считать 90 минут
}

class Report {
    constructor(leads) {
        this.leads = leads;
        this.keywordMessages = [
            "да, хотел бы",
            "хочу в тест",
            "жду звонка",
            "я готов записаться",
            "тестовый пери",
            "хочу запис",
            "хочу записаться на тест",
            "хочу на тест",
            "хочу тест",
            "хочу запис",
            "приду в офис",
            "прийду в офис",
            "приеду в офис",
            "запись в офисе",
            "записаться в офис",
            "офисе тест",
            "офис на тест",
            "можно запис",
            "можно на запис",
            "можно ли запис",
            "запишу",
            "как запис",
            "как могу запис",
            "запишите меня",
            "интересно запис",
            "да запис",
            "записываться как",
            "тестовый период +",
            "можете мне всю информацию по оплате и курсу скинуть",
            "информация по оплате",
            "информацию по оплате",
            "информацию по курс",
            "что нужно кроме уд"
        ]
    }

    clean_leads() {
        let unique_leads = []
        for (let lead of this.leads) {
            let id = unique_leads.findIndex(l => l.equal(lead));
            if (id === -1) {
                if (!lead.email.toLowerCase().includes('fake') || !IGNORE_EMAILS.includes(lead.email.toLowerCase()))
                    unique_leads.push(lead);
            } else {
                unique_leads[id].recalculate_finish_time(lead.totalTime);
            }
        }
        this.leads = unique_leads;
    }

    get_finished_leads() {
        return this.leads.filter(l => l.isFinished);
    }

    agregate_want_to_study_leads() {
        for (let lead of this.leads) {
            let msg = lead.messages.toString();
            for (let text of this.keywordMessages) {
                if (msg.includes(text))
                    lead.want_to_study = true;
            }
        }
    }

    get_want_to_study_leads() {
        return this.leads.filter(l => l.want_to_study);
    }

    get_percent_of_finished_leads() {
        let finished_count = this.get_finished_leads().length;
        let total_count = this.leads.length;
        let resultPercent = finished_count * 100 / total_count;
        return resultPercent.toFixed(2);
    }

    get_finished_leads_count() {
        //сюда
        let all_time = parseInt(document.getElementsByClassName('st-minutes')[0].innerText); //178
        let startDate = document.getElementsByClassName('st-start')[0].innerText.split(',');
        let hours_and_minutes = startDate[1].trim().split(":")
        startDate = startDate[0].split('.');
        // startDate = new Date(date[2], date[1], date[0], hours_and_minutes[0], hours_and_minutes[1])
        const endDate = new Date(startDate.getTime() + all_time * 60000)
        startDate = new Date(endDate.getTime() - MAX_MINUTES * 60000)
        //l total
        return this.leads.filter(l => {
            return l.finish_time >= startDate;
        }).length;
    }

    get_little_time_leads_count() {
        return this.leads.filter(l => l.totalTime < MIN_MINUTES).length;
    }

    get_income_leads_count() {
        return this.leads.filter(l => l.totalTime < MAX_MINUTES && l.totalTime >= MIN_MINUTES).length;
    }

    get_want_to_study_percent_from_all() {
        let total_count = this.leads.length;
        let want_to_study_count = this.get_want_to_study_leads().length;
        let resultPercent = want_to_study_count * 100 / total_count;
        return resultPercent.toFixed(2);
    }

    get_want_to_study_percent_from_finished() {
        let finished_count = this.get_finished_leads_count();
        let want_to_study_count = this.get_want_to_study_leads().length;
        let resultPercent = want_to_study_count * 100 / finished_count;
        return resultPercent.toFixed(2);
    }

}

function agregate_leads() {
    let users = document.getElementsByClassName('userItem');
    let leads = []
    for (let user of users) {
        try {
            let username = user.getElementsByClassName('username')[0].innerText;
            let email = user.getElementsByClassName('email')[0].innerText;
            let phone = user.getElementsByClassName('phone')[0].innerText;
            let start_time = user.getElementsByClassName('viewSince')[0].innerText;
            let finish_time = user.getElementsByClassName('finished')[0].innerText;
            let user_messages = [];
            try {
                user_messages = user.getElementsByClassName('userMessages')[0].getElementsByTagName('div');
            } catch (error) {
                user_messages = [];
            }

            let lead = new Lead(username, email, phone, start_time, finish_time);
            for (let message of user_messages) {
                lead.messages.push(message.innerText)
            }
            lead.set_start_dateTime();
            lead.set_finish_dateTime();
            lead.set_is_finished();
            leads.push(lead);
        } catch (error) {
            console.log("Объект не содержит необходимой для отчета информации");
        }

    }
    return leads;
}

function prepareData() {
    let want_to_sign_block = document.getElementById('want-to-sign');
    want_to_sign_block.innerHTML = '';
    let report = new Report(agregate_leads());
    report.clean_leads();
    report.agregate_want_to_study_leads();
    let all_leads_count = report.leads.length;
    document.getElementById('want_study_count').innerText = report.get_want_to_study_leads().length;
    document.getElementById('total').innerText = all_leads_count;
    document.getElementById('finished').innerText = report.get_finished_leads_count();
    document.getElementById('income').innerText = report.get_income_leads_count();
    document.getElementById('small').innerText = report.get_little_time_leads_count();
    document.getElementById('finished_from_all_percent').innerText = report.get_percent_of_finished_leads();
    document.getElementById('want_to_study_from_all_percent').innerText = report.get_want_to_study_percent_from_all();
    document.getElementById('want_to_study_from_finished_percent').innerText = report.get_want_to_study_percent_from_finished();
    for (let lead of report.get_want_to_study_leads()) {
        let lead_html = document.createElement('div');
        lead_html.innerHTML =
            `<div class="lead">
            <h4>${lead.username}</h4>
            <p>${lead.phone} | ${lead.email}</p>
         </div> <hr>`;
        want_to_sign_block.appendChild(lead_html);
    }
}

function prepare_report_block() {
    let report_block = document.createElement('div');
    report_block.innerHTML = '<div id="report-block">' +
        '<button id="getReport">Сгенерировать отчет</button>' +
        '<div class="params">Настройки <br>' +
        `Макс :<input type="number" value="${MAX_MINUTES}" class="config" placeholder="Время до конца" id="finished_time"/>
        <button id="save_max_time">Сохранить</button> <hr>` +
        `Мин : <input type="number" value="${MIN_MINUTES}" class="config" placeholder="Время минимальное" id="minimum_time"/>
        <button id="save_min_time">Сохранить</button> <hr>` +
        '</div>' +
        '<h3>Статистика</h3>' +
        '<p>Всего: <span id="total"></span></p>' +
        '<p>Хочет записаться: <span id="want_study_count"></span></p>' +
        `<p>До конца (<span id="finished_minutes">${MAX_MINUTES}</span> и более минут): <span id="finished"></span></p>` +
        `<p>Пришел (более <span id="min_minutes">${MIN_MINUTES}</span> минут): <span id="income"></span></p>` +
        `<p>Мало (менее <span id="min_small_minutes">${MIN_MINUTES}</span> минут): <span id="small"></span></p>` +
        `<p>До конца (из общего): <span id="finished_from_all_percent"></span> %</p>` +
        `<p>Хочет записаться (из общего): <span id="want_to_study_from_all_percent"></span> %</p>` +
        `<p>Хочет записаться (из завершивших): <span id="want_to_study_from_finished_percent"></span> %</p>` +
        '<hr>' +
        '<h3>Хотят записаться</h3>' +
        '<div id="want-to-sign"></div>' +
        '<style>*{margin:0; padding:0;} #report-block{z-index:2;background-color:white;font-size:11px;position: fixed;right: 15px;top: 20px;width: 500px;border: 1px solid silver;padding: 10px;overflow-y: scroll;height: 90%;}' +
        '#getReport{margin: auto;border-radius: 5px;padding: 10px;cursor: pointer;}</style></div>';
    document.body.appendChild(report_block);
    let save_max = document.getElementById('save_max_time');
    let save_min = document.getElementById('save_min_time');
    let button = document.getElementById('getReport');
    button.addEventListener('click', event => {
        prepareData();
    });
    save_max.addEventListener('click', event => {
        let finished_time = document.getElementById('finished_time').value;
        MAX_MINUTES = finished_time;
        document.getElementById('finished_minutes').innerText = MAX_MINUTES;
    });
    save_min.addEventListener('click', event => {
        let minimum_time = document.getElementById('minimum_time').value;
        MIN_MINUTES = minimum_time;
        document.getElementById('min_minutes').innerText = MIN_MINUTES;
        document.getElementById('min_small_minutes').innerText = MIN_MINUTES;
    });
}

prepare_report_block();
