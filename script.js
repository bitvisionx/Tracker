let coins = {};

function saveData() {
  localStorage.setItem('cryptoTracker', JSON.stringify(coins));
}

function loadData() {
  const data = localStorage.getItem('cryptoTracker');
  coins = data ? JSON.parse(data) : { blox: [], bitvavo: [] };
}

function getCoinId(name) {
  const map = {
    bitcoin: 'bitcoin',
    btc: 'bitcoin',
    xrp: 'ripple',
    ripple: 'ripple',
    ethereum: 'ethereum',
    eth: 'ethereum'
  };
  return map[name.toLowerCase()] || name.toLowerCase();
}

async function fetchPrice(symbol) {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=eur`;
  const res = await fetch(url);
  const data = await res.json();
  return data[symbol]?.eur || 0;
}

function renderSection(section) {
  const listEl = document.getElementById(`${section}-list`);
  const summaryEl = document.getElementById(`${section}-summary`);
  listEl.innerHTML = '';
  let totalValue = 0;
  let totalPaid = 0;

  coins[section].forEach(async (coin, i) => {
    const coinId = getCoinId(coin.name);
    const price = await fetchPrice(coinId);
    const div = document.createElement('div');
    div.className = 'coin';

    let totalCoinAmount = 0;
    let totalCoinPaid = 0;

    const aankopenHtml = coin.aankopen
      .map((aankoop, j) => {
        const currentValue = aankoop.amount * price;
        const aankoopWaarde = aankoop.amount * aankoop.price;
        totalCoinAmount += aankoop.amount;
        totalCoinPaid += aankoopWaarde;
        return `
          <div class="aankoop">
            Aantal: <input type="number" value="${aankoop.amount}" onchange="updateAankoop('${section}', ${i}, ${j}, 'amount', this.value)" />
            Prijs: <input type="number" value="${aankoop.price}" onchange="updateAankoop('${section}', ${i}, ${j}, 'price', this.value)" />
            <button onclick="removeAankoop('${section}', ${i}, ${j})">❌</button><br/>
          </div>
        `;
      })
      .join('');

    const currentCoinValue = totalCoinAmount * price;
    const coinProfit = currentCoinValue - totalCoinPaid;
    totalValue += currentCoinValue;
    totalPaid += totalCoinPaid;

    div.innerHTML = `
      <h3>${coin.name.toUpperCase()}</h3>
      Live prijs: €${price.toFixed(2)}<br/>
      <div>${aankopenHtml}</div>
      <button onclick="addAankoop('${section}', ${i})">+ Aankoop toevoegen</button><br/>
      Totale hoeveelheid: ${totalCoinAmount.toFixed(4)}<br/>
      Totaal betaald: €${totalCoinPaid.toFixed(2)}<br/>
      Live waarde: €${currentCoinValue.toFixed(2)}<br/>
      Winst/Verlies: €${coinProfit.toFixed(2)}<br/>
      <button onclick="removeCoin('${section}', ${i})">🗑️ Coin verwijderen</button>
    `;
    listEl.appendChild(div);
  });

  setTimeout(() => {
    summaryEl.innerHTML = `
      <strong>TOTAAL ${section.toUpperCase()}</strong><br/>
      Aankoopwaarde: €${totalPaid.toFixed(2)}<br/>
      Live waarde: €${totalValue.toFixed(2)}<br/>
      Winst/Verlies: €${(totalValue - totalPaid).toFixed(2)}<br/>
    `;
    renderTotalSummary();
  }, 1000);
}

function renderTotalSummary() {
  const b = document.getElementById('blox-summary')?.innerText?.match(/€([\d\.]+)/g);
  const v = document.getElementById('bitvavo-summary')?.innerText?.match(/€([\d\.]+)/g);
  if (!b || !v) return;

  const totalPaid = parseFloat(b[0]) + parseFloat(v[0]);
  const totalValue = parseFloat(b[1]) + parseFloat(v[1]);
  const diff = totalValue - totalPaid;

  document.getElementById('total-summary').innerHTML = `
    <h2>TOTAAL OVERZICHT</h2>
    Totale aankoop: €${totalPaid.toFixed(2)}<br/>
    Totale waarde: €${totalValue.toFixed(2)}<br/>
    Totale winst/verlies: €${diff.toFixed(2)}<br/>
  `;
}

function addCoin(section) {
  const name = prompt("Voer de naam van de munt in (bv. bitcoin, xrp):");
  if (!name) return;
  if (!coins[section]) coins[section] = [];
  coins[section].push({ name, aankopen: [] });
  saveData();
  renderSection(section);
}

function addAankoop(section, coinIndex) {
  coins[section][coinIndex].aankopen.push({ amount: 0, price: 0 });
  saveData();
  renderSection(section);
}

function updateAankoop(section, coinIndex, aankoopIndex, key, value) {
  coins[section][coinIndex].aankopen[aankoopIndex][key] = parseFloat(value);
  saveData();
  renderSection(section);
}

function removeAankoop(section, coinIndex, aankoopIndex) {
  coins[section][coinIndex].aankopen.splice(aankoopIndex, 1);
  saveData();
  renderSection(section);
}

function removeCoin(section, coinIndex) {
  coins[section].splice(coinIndex, 1);
  saveData();
  renderSection(section);
}

loadData();
renderSection('blox');
renderSection('bitvavo');
