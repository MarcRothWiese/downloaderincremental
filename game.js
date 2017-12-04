/* 
  Idle game inspired by Idle Downloader. http://www.crazygames.com/game/idle-downloader
 */

(function() {

    var tick_time = 50;
    var downloading_index = 0;
    var last_tick_time = new Date();

    var events = {
        equipped: {
            wifi: 0
        },
        research: {
            modem_tethering: 0
        },
        bitched_about_holding_button: 0,
        show_time: false,
        show_caffeine: false,
        auto_fail: {
            failure_count: 0,
            fail_1: 0
        }
    };

    var dialogs = [
        {
            speaker: 'The Man',
            text: 'We\'re paying you big money to get these files downloaded. Hold the download button to get started.',
            fn: function() {

                files.push(pending_files.practice);
             },
            pre: function() { return true; },
        },
        {
            speaker: 'You',
            text: 'Why do I have to hold down the button? Is this computer so junky that it can\'t just automate it?',
            fn: function() { events.bitched_about_holding_button = 1; },
            pre: function() { return company.money > .05; }
        },
        {
            speaker: 'The Man', 
            text: 'Well, it\'s the best we can do. Besides, we can find someone else to do this.',
            fn: function() { events.bitched_about_holding_button = 2; },
            pre: function() { return events.bitched_about_holding_button === 1 && company.money > .07; }
        }, 
        {
            speaker: 'You',
            text: 'Is that a joke? You hired a network engineer to hold down a button?',
            fn: function() { events.bitched_about_holding_button = 3; },
            pre: function() { return events.bitched_about_holding_button === 2 && company.money > .09; }
        },
        {
            speaker: 'The Man',
            text: 'We know you need the money.',
            fn: function() { events.bitched_about_holding_button = 4; },
            pre: function() { return events.bitched_about_holding_button === 3 && company.money > .11; }
        },
        {
            speaker: 'You',
            text: 'Fine. I knew I told you to much. Can I at least get a faster connection? This is death slow.',
            fn: function() { events.bitched_about_holding_button = 5; },
            pre: function() { return events.bitched_about_holding_button === 4 && company.money > .13; }
        },
        {
            speaker: 'The Man',
            text: 'That\'s the spirit! Here you go.',
            fn: function() { 
                events.bitched_about_holding_button = 6; 
                equipment.unshift(pending_equipment.modem56k);
            },
            pre: function() { return events.bitched_about_holding_button === 5 && company.money > .15; }
        },
        {
            speaker: 'You', 
            text: 'What the hell? Smart ass.',
            fn: function() { }, 
            pre: function() { return events.bitched_about_holding_button === 6; }
        },
        {
            speaker: 'The Man', 
            text: 'By the way, you need to track your time. Make sure you clock in and out every day.',
            fn: function() { 
                company.total_time = 0;
                company.time = 0;
                events.show_time = true;
             }, 
            pre: function() { return events.bitched_about_holding_button === 6; }
        },
        {
            speaker: 'You',
            text: '...', 
            fn: function() {
                equipment.unshift(pending_equipment.compression1);
            }, 
            pre: function() { return events.show_time && company.total_time > 10; }
        },
        {
            speaker: 'You', 
            text: 'I bet I can tweak some other settings and get better compression.', 
            fn: function() {
                equipment.unshift(pending_equipment.compression2);
            },
            pre: function() { return events.show_time && company.total_money > 3; }
        },
        {
            speaker: 'You', 
            text: 'I just need to download a macro program and I can stick it to the man.',
            fn: function() {
                files.push(pending_files.macro_program);
            }, 
            pre: function() { return company.total_money > .4; }
        },
        {
            speaker: 'You', 
            text: 'Okay, I guess my script is buggy. It keeps stopping. Time to find a tutorial. I can keep on clicking every now and then while I look.', 
            fn: function() {
                events.auto_fail.fail_1 = 1;
            }, 
            pre: function() { return events.show_time && events.auto_fail.failure_count > 2; }
        }, 
        {
            speaker: 'You', 
            text: 'Google is blocked here? @#(@%(!@*&^$)$(#@*%^!', 
            fn: function() {
                events.auto_fail.fail_1 = 2;
            }, 
            pre: function() { return events.show_time && events.auto_fail.fail_1 === 1 && events.auto_fail.failure_count > 4; }
        }, 
        {
            speaker: 'You', 
            text: 'Fine, I\'ll just look it up on my phone.', 
            fn: function() {
                events.auto_fail.fail_1 = 3;
                equipment.unshift(pending_equipment.macro2);
            }, 
            pre: function() { return events.show_time && events.auto_fail.fail_1 === 2 && events.auto_fail.failure_count > 5; }
        }, 
        {
            speaker: 'You', 
            text: 'Wait a second. I bet I could figure out how to hook up my phone to this piece of junk. That would be so much faster.', 
            fn: function() {
                equipment.unshift(pending_equipment.research_tethering);
            }, 
            pre: function() { return events.auto_fail.fail_1 === 4; }
        },
        {
            speaker: 'You', 
            text: 'I still missed something in the auto downloader script.', 
            fn: function() {
                equipment.unshift(pending_equipment.macro3);
            }, 
            pre: function() { return events.auto_fail.fail_1 === 4 && events.auto_fail.failure_count > 1; }
        },
        {
            speaker: 'You', 
            text: 'Naturally, they\'ve hooking up your phone on USB blocked. I wonder if a wi-fi adapter would work?', 
            fn: function() {
                equipment.unshift(pending_equipment.wifi_adapter);
            }, 
            pre: function() { return events.research.modem_tethering > 0; }
        },
        {
            speaker: 'The Man', 
            text: 'You\'ve proven capable of downloading our practice file. I think it\'s time to ease you into our business.', 
            fn: function() { 
                files.push(pending_files.password_file);
                files.push(pending_files.essay_file);
                files.push(pending_files.song);
            }, 
            pre: function() { return company.total_money > 1 || company.total_time > 300; }
        }, 
        {
            speaker: 'You', 
            text: 'I\'ve got to figure out how to make more money here...', 
            fn: function() {
                equipment.unshift(pending_equipment.money_upgrade_1);
            },
            pre: function() { return company.total_time > 30 && events.show_time; }
        }, 
        {
            speaker: 'Carl', 
            text: 'Hi there! Welcome to your first day. I\'ve got an extra energy drink. Here you go!', 
            fn: function() {
                company.caffeine = 50;
                events.show_caffeine = true;
            }, 
            pre: function() { return company.total_time > 360 || company.total_money > 3; }
        }, 
        {
            speaker: 'You', 
            text: 'I bet I can figure out a way to compress these files even better...', 
            fn: function() {
                equipment.unshift(pending_equipment.compression3);
            }, 
            pre: function() { return company.total_time > 420 || company.total_money > 5; }
        },
        {
            speaker: 'You', 
            text: 'Wait... why is the script still failing? I\'m positive it\'s not buggy.', 
            fn: function() { },
            pre: function() { return events.auto_fail.fail_1 === 5 && events.auto_fail.failure_count > 0; }
        }
    ];

    var alerts = [];

    var pending_equipment = {
        money_upgrade_1: {
            name: 'Negotiate a Better Rate', 
            description: 'Put together a presentation demonstrating your value as an employee. (Doubles money gains from non-practice files).', 
            cost: 0, 
            time: 120, 
            class: 'money', 
            fn: function() {
                for (const i in pending_files) {
                    if (pending_files[i].download_reward > 0.02) {
                        pending_files[i].download_reward *= 2;
                    }
                }
            }, 
            purchased: false
        },
        compression1: {
            name: 'Static Compression',
            description: 'They left the compression option in the browser\'s settings turned off... (Reduce effective file size by 20%)',
            cost: 0, 
            time: 30,
            class: 'file', 
            fn: function() {
                for (const i in pending_files) {
                    pending_files[i].size *= .8;
                }
            },
            purchased: false
        },
        compression2: {
            name: 'Dynamic Compression',
            description: 'Tweak some more settings. (Reduce effective file size by 20%)',
            cost: 0, 
            time: 60,
            class: 'file', 
            fn: function() {
                for (const i in pending_files) {
                    pending_files[i].size *= .8;
                }
            },
            purchased: false
        },
        compression3: {
            name: 'Text Compression',
            description: 'Figure out how to better compress text files. (Reduce effective file size of text files by 50%)',
            cost: 0, 
            time: 180,
            class: 'file', 
            fn: function() {
                for (const i in pending_files) {
                    if (pending_files[i].type === 'text') {
                        pending_files[i].size *= .5;
                    }
                }
            },
            purchased: false
        },
        macro1: {
            name: 'Simple Macro Script', 
            description: 'Write a simple script for MacroDeluxe 2000.', 
            cost: 0,
            time: 60,
            class: 'auto', 
            fn: function() {
                company.autodownloader_failure_rate = .01;
                alerts.unshift({
                    speaker: 'You', 
                    text: 'Sweet! Now I should just have to click the button and it\'ll just go.',
                    displaytime: 15
                });
            },
            purchased: false
        },
        macro2: {
            name: 'Macro Script Bug Fix', 
            description: 'Found the bug. It was an off-by-one error.', 
            cost: 0,
            time: 60,
            class: 'auto', 
            fn: function() {
                company.autodownloader_failure_rate = .001;
                events.auto_fail.fail_1 = 4;
                events.auto_fail.failure_count = 0;
                alerts.unshift({
                    speaker: 'You', 
                    text: 'Oops. Oh well. Now it\'s time to kick back and watch my money grow.',
                    displaytime: 15
                });
            },
            purchased: false
        },
        macro3: {
            name: 'Macro Script Bug Fix', 
            description: 'Found the bug. It was an another off-by-one error. This script is only 3 lines long!', 
            cost: 0,
            time: 60,
            class: 'auto', 
            fn: function() {
                company.autodownloader_failure_rate = .0001;
                events.auto_fail.fail_1 = 5;
                events.auto_fail.failure_count = 0;
                alerts.unshift({
                    speaker: 'You', 
                    text: 'Okay, now I think it\'s fixed for real this time.',
                    displaytime: 15
                });
            },
            purchased: false
        },
        modem56k: {
            name: '56K Modem',
            description: 'Seriously guys? (6.6 KB/s)',
            cost: .20,
            time: 0,
            class: 'internet',
            fn: function() {
                company.download_bps = 6.6;
            },
            purchased: false,
        }, 
        research_tethering: {
            name: 'Research Phone Tethering', 
            description: 'You were able to look up scripting tutorials on your phone. Why can\'t you tether it?', 
            cost: 0, 
            time: 180, 
            class: 'research', 
            fn: function() {
                events.research.modem_tethering += 1;
            }
        }, 
        wifi_adapter: {
            name: 'USB Wi-Fi Adapter', 
            description: 'Plug this into your computer and hook it up to a Wi-Fi network. Found in Goodwill, so it\'s junk. (90 KB/s)', 
            cost: 20, 
            time: 0, 
            class: 'equipment', 
            fn: function() {
                company.download_bps = 90;
                events.equipped.wifi += 1;
            }
        }
    };

    var equipment = [
        {
            name: 'Gigabit Pipe',
            description: 'Fat pipe to the interwebz. (128 MB/s)',
            cost: 5e5,
            time: 0,
            class: 'internet',
            fn: function() {
                company.download_bps = 131072;
            },
            purchased: false,
        }
    ];

    var company = {
        modem: {},
        money: 0,
        time: 0,
        caffeine: 0,
        total_money: 0,
        total_time: 0,
        download_bps: 2.2,
        download_build: .01,
        download_decay: .95,
        time_rate: 1,
        autodownloader_failure_rate: 1
    };

    var pending_files = {
        song: {
            id: 5, 
            type: 'media',
            active_download: false, 
            passive_download: false,
            name: 'popular song', 
            description: 'A DRM free version of a popular song. That means it\'s short.', 
            size: 3000, 
            download_reward: 12, 
            current_speed: 0,
            current_progress: 0,
            fn: function() {},
            current_progress_pc: function() { 

                if (this.current_speed < (this.size / 2)) {
                    return this.current_progress / this.size * 100; 
                } else {
                    return 100;
                }
            },
            size_formatted: function() { return this.size.toLocaleString() + ' B' }
        },
        essay_file: {
            id: 3, 
            type: 'text',
            active_download: false, 
            passive_download: false,
            name: 'thesis.docx', 
            description: 'This look\'s like someone\'s doctoral thesis. Why are they collecting these?', 
            size: 400, 
            download_reward: 1.2, 
            current_speed: 0,
            current_progress: 0,
            fn: function() {},
            current_progress_pc: function() { 

                if (this.current_speed < (this.size / 2)) {
                    return this.current_progress / this.size * 100; 
                } else {
                    return 100;
                }
            },
            size_formatted: function() { return this.size.toLocaleString() + ' B' }
        },
        password_file: {
            id: 3, 
            type: 'text',
            active_download: false, 
            passive_download: false,
            name: 'passwords.txt', 
            description: 'A small dictionary of username and password combinations. I wonder what they do with these?', 
            size: 200, 
            download_reward: .4, 
            current_speed: 0,
            current_progress: 0,
            fn: function() {},
            current_progress_pc: function() { 

                if (this.current_speed < (this.size / 2)) {
                    return this.current_progress / this.size * 100; 
                } else {
                    return 100;
                }
            },
            size_formatted: function() { return this.size.toLocaleString() + ' B' }
        },
        macro_program: {
            id: 2, 
            type: 'text',
            active_download: false, 
            passive_download: false,
            name: 'MacroDeluxe 2000', 
            description: 'Fully featured free program that let\'s you automate holding down the button.', 
            size: 200, 
            download_reward: 0, 
            current_speed: 0,
            current_progress: 0,
            fn: function() {

                let i = files.findIndex(e => e.id === 2);
                files.splice(i, 1);
                equipment.unshift(pending_equipment.macro1);
            },
            current_progress_pc: function() { 

                if (this.current_speed < (this.size / 2)) {
                    return this.current_progress / this.size * 100; 
                } else {
                    return 100;
                }
            },
            size_formatted: function() { return this.size.toLocaleString() + ' B' }
        },
        practice: {
            id: 1,
            type: 'text',
            active_download: false,
            passive_download: false,
            name: 'junkfile',
            description: 'A practice file.', 
            size: 10, // KB
            download_reward: 0.01,
            current_speed: 0,
            current_progress: 0,
            current_progress_pc: function() { 
                if (this.current_speed < (this.size / 2)) {

                    return this.current_progress / this.size * 100; 
                } else {

                    return 100;
                }
            },
            size_formatted: function() { return this.size.toLocaleString() + ' B' }
        }
    };

    var files = [
    ];

    var tick = function() {

        let time = new Date();
        let delta = (time.getTime() - last_tick_time.getTime()) / 1000;
        last_tick_time = time;

        if (company.caffeine > 0) {
            company.caffeine -= 0.01;
            company.time_rate = 3;
        } else {
            company.time_rate = 1;
        }

        company.time += delta * company.time_rate;
        company.total_time += delta * company.time_rate;

        for (let i = 0; i < dialogs.length; i++) {

            if (dialogs[i].pre()) {

                dialogs[i].displaytime = 15;
                dialogs[i].fn();
                alerts.unshift(dialogs[i]);
                dialogs.splice(i, 1);
            }
        }

        for (let i = 0; i < alerts.length; i++) {

            alerts[i].displaytime -= delta;

            if (alerts[i].displaytime < 0) {
                alerts.splice(i, 1);
            }
        }

        for (let i = 0; i < files.length; i++) {

            if (!files[i].active_download && files[i].passive_download && Math.random() < company.autodownloader_failure_rate) {
                files[i].passive_download = false;

                if (company.autodownloader_failure_rate !== 1) {
                    events.auto_fail.failure_count += 1;
                }
            }

            // handle speed 
            if (files[i].active_download || files[i].passive_download) {
                files[i].current_speed += (company.download_bps * company.download_build);
            } else {
                files[i].current_speed *= company.download_decay;
            }

            if (company.download_bps < files[i].current_speed) {
                files[i].current_speed = company.download_bps;
            }

            // handle download progress
            files[i].current_progress += files[i].current_speed * delta;
            if (files[i].current_progress > files[i].size) {

                company.money += files[i].download_reward;
                company.total_money += files[i].download_reward;
                files[i].current_progress = 0;
                if (files[i].fn) {
                    files[i].fn();
                }
            }
        }
    };

    var timer = setInterval(function() {
        tick();
    }, tick_time);

    Vue.component('money-display', {

        template: '<p class="navbar-text display-money">¤ {{ money.toFixed(2) }}</p>', 
        props: ['money']
    });

    Vue.component('time-display', {
        
        template: '<p class="navbar-text display-time"><span class="glyphicon glyphicon-time"></span> {{ time.toFixed(2) }}</p>', 
        props: ['time']
    });

    Vue.component('caffeine-display', {
        
        template: '<p class="navbar-text display-caffeine"><span class="glyphicon glyphicon-fire"></span> {{ caffeine.toFixed(2) }}</p>', 
        props: ['caffeine']
    });

    Vue.component('file-display', {

        template: '#file-display',
        props: ['file', 'index'],
        methods: {
            startDownload: function() {
                this.file.active_download = true;
                this.file.passive_download = true;
            },
            stopDownload: function() {
                this.file.active_download = false;
            }
        }
    });

    Vue.component('alert-display', {
        template: '#alert-display',
        props: ['alert']
    });

    Vue.component('upgrade-display', {
        template: '#upgrade-display',
        props: ['upgrade', 'company'],
        methods: {
            buyEquipment: function(equipment) {
                if (equipment.cost > company.money) {
                    return;
                }

                if (equipment.time > company.time) {
                    return;
                }

                company.money -= equipment.cost;
                company.time -= equipment.time;
                company.modem = equipment;
                equipment.purchased = true;
                equipment.fn();
            }
        }
    })

    var game = new Vue({

        el: '#game',
        data: {
            company: company,
            files: files,
            upgrades: equipment,
            alerts: alerts, 
            events: events
        }
    });
})();