const axios = require('axios');
const qs = require('qs');
const cheerio = require('cheerio');

const formUrl = 'https://www.joinmarriottbonvoy.com/gojek/s/EN-GB';

const baseHeaders = {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'accept-language': 'en-US,en;q=0.9',
    'cache-control': 'no-cache',
    'pragma': 'no-cache',
    'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
};

async function getSessionData() {
    let attempts = 0;
    while (true) {
        attempts++;
        try {
            const response = await axios.get(formUrl, { headers: baseHeaders });
            const cookies = response.headers['set-cookie'];
            if (!cookies || cookies.length === 0) throw new Error('Cookie tidak ditemukan');
            const cookieString = cookies.map(c => c.split(';')[0]).join('; ');

            const $ = cheerio.load(response.data);
            const viewState = $('#__VIEWSTATE').val();
            const viewStateGenerator = $('#__VIEWSTATEGENERATOR').val();
            const eventValidation = $('#__EVENTVALIDATION').val();

            if (!viewState || !viewStateGenerator || !eventValidation) {
                throw new Error('Token tidak ditemukan');
            }

            return { cookieString, viewState, viewStateGenerator, eventValidation };
        } catch (error) {
            console.error(`  [Error di Tahap 1, Percobaan #${attempts}] ${error.message}`);
        }
    }
}

async function submitForm(email, sessionData) {
    const postHeaders = {
        ...baseHeaders,
        'content-type': 'application/x-www-form-urlencoded',
        'cookie': sessionData.cookieString,
        'origin': 'https://www.joinmarriottbonvoy.com',
        'referer': formUrl,
        'sec-fetch-site': 'same-origin',
    };

    const dataPayload = {
        '__EVENTTARGET': 'ctl00$PartialEnrollFormPlaceholder$partial_enroll$EnrollButton',
        '__EVENTARGUMENT': '',
        '__LASTFOCUS': '',
        '__VIEWSTATE': sessionData.viewState,
        '__VIEWSTATEGENERATOR': sessionData.viewStateGenerator,
        '__SCROLLPOSITIONX': '0',
        '__SCROLLPOSITIONY': '0',
        '__EVENTVALIDATION': sessionData.eventValidation,
        'ctl00$UpperRight$LanguagePicker$ctlLanguage': 'EN-GB',
        'ctl00$UpperRight$LanguagePicker$hdnpromotionID': '3841',
        'ctl00$UpperRight$LanguagePicker$hdnCtycode': 'EN-GB',
        'ctl00$PartialEnrollFormPlaceholder$partial_enroll$first_name': 'Apep',
        'ctl00$PartialEnrollFormPlaceholder$partial_enroll$last_name': 'Rustandim',
        'ctl00$PartialEnrollFormPlaceholder$partial_enroll$email_address': email,
        'ctl00$PartialEnrollFormPlaceholder$partial_enroll$country': 'ID',
        'ctl00$PartialEnrollFormPlaceholder$partial_enroll$sms_consent': 'on',
        'ctl00$PartialEnrollFormPlaceholder$partial_enroll$phone_number_country': '62',
        'ctl00$PartialEnrollFormPlaceholder$partial_enroll$phone_number_subscriber': '',
        'ctl00$PartialEnrollFormPlaceholder$partial_enroll$ctlConsent$chk_mi': 'on',
        'ctl00$PartialEnrollFormPlaceholder$partial_enroll$ctlConsent$chk_tp': 'on',
        'ctl00$PartialEnrollFormPlaceholder$partial_enroll$ctlConsent$ctlAgree': 'on',
        'ctl00$PartialEnrollFormPlaceholder$partial_enroll$hdn_send_email': 'True',
        'ctl00$PartialEnrollFormPlaceholder$partial_enroll$hdn_send_sms': 'False',
        'ctl00$PartialEnrollFormPlaceholder$partial_enroll$hdn_list_mode': '0',
        'ctl00$PartialEnrollFormPlaceholder$partial_enroll$hdn_customer_key': '',
    };

    let attempts = 0;
    while (true) {
        attempts++;
        console.log(`  (Percobaan #${attempts}) Kirim form: ${email}`);
        try {
            const response = await axios.post(formUrl, qs.stringify(dataPayload), { headers: postHeaders });
            if (response.data.includes('The service is unavailable.')) {
                console.error('  [Gagal] Layanan tidak tersedia. Mencoba lagi...');
            } else {
                console.log(`  ✅ Berhasil kirim ke ${email}`);
                break;
            }
        } catch (error) {
            console.error(`  [Error di submitForm] ${error.message}`);
        }
    }
}

function generateEmail(baseEmail, index) {
    const [local, domain] = baseEmail.split('@');
    return `${local}+${index}@${domain}`;
}

async function startBotMassal(baseEmail, emailCount = 10) {
    const sessionData = await getSessionData();

    for (let i = 1; i <= emailCount; i++) {
        const email = generateEmail(baseEmail, i);
        await submitForm(email, sessionData);
    }

    console.log('\n🎉 Semua proses pengiriman selesai!');
}

// Contoh: Mengirim ke 10 email: kallolorifan9+1@gmail.com sampai +10
startBotMassal('kallolorifan9@gmail.com', 10);
