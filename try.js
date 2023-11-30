document.addEventListener("DOMContentLoaded", function () {
  const patientIdInput = document.getElementById('referId');
  const patientIdDropdown = document.getElementById('referIdDropdown');

 
  const patientIds = JSON.parse('<%- patientId %>');

  // Rest of your code...

  // Event listener for input changes for patientId
  patientIdInput.addEventListener('input', function () {
    const inputValue = patientIdInput.value.toLowerCase();
    const filteredPatientIds = patientIds.filter(id =>
      id.toLowerCase().includes(inputValue)
    );

    // Clear previous dropdown content
    patientIdDropdown.innerHTML = '';

    // Add filtered options to the dropdown
    filteredPatientIds.forEach(id => {
      const option = document.createElement('a');
      option.textContent = id;
      option.addEventListener('click', function () {
        patientIdInput.value = id;
        patientIdDropdown.style.display = 'none';
      });
      patientIdDropdown.appendChild(option);
    });
    
    // Show the dropdown
    patientIdDropdown.style.display = filteredPatientIds.length > 0 ? 'block' : 'none';
  });
  
document.addEventListener('click', function (event) {
  if (!event.target.matches('#patientId')) {
      patientIdDropdown.style.display = 'none';
  }
});


  // Rest of your code...

});
