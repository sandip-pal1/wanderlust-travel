const taxSwitch = document.getElementById("switchCheckDefault");
taxSwitch.addEventListener("click", () => {
  const basePrices = document.querySelectorAll(".base-price");
  const taxInfos = document.querySelectorAll(".tax-info");

  for (let i = 0; i < basePrices.length; i++) {
    const baseText =
      basePrices[i].dataset.original || basePrices[i].textContent.trim();
    const base = parseFloat(baseText.replace(/,/g, ""));

    if (!basePrices[i].dataset.original) {
      basePrices[i].dataset.original = base; // Save original
    }

    const showingWithTax = taxInfos[i].style.display === "inline";

    if (showingWithTax) {
      // Show original price
      basePrices[i].textContent = Number(base).toLocaleString("en-IN");
      taxInfos[i].style.display = "none";
    } else {
      // Show price with 18% GST
      const withTax = (base * 1.18).toFixed(0);
      basePrices[i].textContent = Number(withTax).toLocaleString("en-IN");
      taxInfos[i].style.display = "inline";
    }
  }
});
