import { places } from './places.js';

var rowIdCounter;

function filterListByRegex(list, regexPattern) {
    // Convert the string pattern to a RegExp object
    const regex = new RegExp(regexPattern, "i");
  
    // Filter the list based on the regex match against the first entry of each sub-array
    const filteredList = list.filter((item) => regex.test(item[0]));
  
    return filteredList;
}

function createSearchLayer(pattern, color) {
    const filteredList = filterListByRegex(places, pattern);
    var l = L.layerGroup();

    if (L.Browser.mobile) {
        var radius = 4;
    } else {
        var radius = 2;
    }

    filteredList.forEach((entry) => {
        var circle = L.circleMarker([entry[1], entry[2]], {
                color: color,
                fillColor: color,
                fillOpacity: 1.0,
                radius: radius
            });
        
        if (L.Browser.mobile) {
            circle.bindPopup(entry[0]);
        }
        else {
            circle.bindTooltip(entry[0]);
        }
        l.addLayer(circle);
    })

    l.addTo(map);

    return l;
}

// Initialize the map and set its view to our chosen geographical coordinates and a zoom level
var map = L.map('map');

map.fitBounds([
    [49.78246728568144, -5.902971710962088],
    [58.76164090151216, -2.38706000101467]
]);

// Add an OpenStreetMap tile layer to the map
var osm_grayscale = L.tileLayer.grayscale('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);


var baseMaps = {
    "OpenStreetMap": osm_grayscale,
};
var layerControl = L.control.layers(baseMaps, {}).addTo(map);

var idToLayer = {};

const initialColors = ["#e31a1c", "#1f78b4", "#33a02c", "#ff7f00", "#984ea3"]

function addRow() {
            const newRow = document.createElement('div');
            newRow.className = 'input-row';
            newRow.setAttribute('data-id', rowIdCounter); // Assign unique ID to the row
            newRow.innerHTML = `
                <input title="Turn layer on/off" type="checkbox" checked="true">
                <input class="search-text" type="text" placeholder="Enter search text here" enterkeyhint="done">
                <select title="Select how the search works" class="dropdown">
                    <option value="anywhere">Anywhere</option>
                    <option value="startswith">Starts with</option>
                    <option value="endswith">Ends with</option>
                    <option value="exactly">Exactly</option>
                    <option value="regex">Regex</option>
                </select>
                <input title="Select colour" type="color" value=${initialColors[rowIdCounter % initialColors.length]}>
                <button class="update-row">Update</button>
                <button title="Remove row" class="remove-row">x</button>
            `;
            const textInput = newRow.querySelector('input[type="text"]');
            textInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    // Prevent the default action to avoid submitting the form if it's part of one
                    e.preventDefault();
                    
                    // Place the code to run on update here, or call the update function
                    // For example, to mimic clicking the update button:
                    const updateButton = newRow.querySelector('.update-row');
                    updateButton.click(); // This simulates clicking the update button programmatically

                    const currentRow = event.target.closest('.input-row'); // Get the current row
                    const container = document.getElementById('input-container');
                    const lastRow = container.lastElementChild.previousElementSibling; // The last row is right above the "Add Row" button

                    if (currentRow === lastRow) {
                        addRow();
                        const lastRow = container.lastElementChild.previousElementSibling;
                        lastRow.querySelector('.search-text').focus();
                    }
                }
            });
            const colorInput = newRow.querySelector('input[type="color"]');
            colorInput.addEventListener('input', function(e) {
                const updateButton = newRow.querySelector('.update-row');
                updateButton.click(); // This simulates clicking the update button programmatically
            });
            const dropdownInput = newRow.querySelector('select');
            dropdownInput.addEventListener('input', function(e) {
                const updateButton = newRow.querySelector('.update-row');
                updateButton.click(); // This simulates clicking the update button programmatically
            });
            const checkbox = newRow.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('click', function(e) {
                const row = e.target.closest('.input-row'); // Find the closest parent row of the clicked button
                const rowId = row.getAttribute('data-id'); // Get the unique ID of the row

                if (e.target.checked) {
                    idToLayer[rowId].addTo(map);
                }
                else {
                    map.removeLayer(idToLayer[rowId]);
                }
            });

            const addButton = document.getElementById('add-row');
            const container = document.getElementById('input-container');

            // Insert the new row before the addButton
            container.insertBefore(newRow, addButton);
            rowIdCounter++; // Increment the counter for the next row
        }


document.addEventListener('DOMContentLoaded', function() {
        rowIdCounter = 0; // Counter to assign a unique ID to each row
        // Initially add one row
        addRow();

        document.getElementById('add-row').addEventListener('click', addRow);
        document.getElementById('share').addEventListener('click', share);

        document.getElementById('input-container').addEventListener('click', function(e) {
            const row = e.target.closest('.input-row'); // Find the closest parent row of the clicked button
            const rowId = row.getAttribute('data-id'); // Get the unique ID of the row

            if (e.target.classList.contains('remove-row')) {
                row.remove();
                if (rowId in idToLayer) {
                    map.removeLayer(idToLayer[rowId]);
                }
            } else if (e.target.classList.contains('update-row')) {
                if (rowId in idToLayer) {
                    map.removeLayer(idToLayer[rowId]);
                }
                const textInputValue = row.querySelector('input[type="text"]').value;
                const colorInputValue = row.querySelector('input[type="color"]').value;

                const dropdownInputValue = row.querySelector('select').value;
                var search = "";
                switch (dropdownInputValue) {
                    case 'startswith':
                        search = "^" + textInputValue;
                        break;
                    case 'endswith':
                        search = textInputValue + "$";
                        break;
                    case 'exactly':
                        search = "^" + textInputValue + "$";
                        break;
                    default:
                        search = textInputValue;
                }

                var newLayer = createSearchLayer(search, colorInputValue)
                idToLayer[rowId] = newLayer;
                row.querySelector('input[type="checkbox"]').checked = true;
                _paq.push(['trackSiteSearch',
                    // Search keyword searched for
                    search,
                    // Search category selected in your search engine. If you do not need this, set to false
                    dropdownInputValue,
                    // Number of results on the Search results page. Zero indicates a 'No Result Search Keyword'. Set to false if you don't know
                    false
                ]);
            }
        });
    });


function saveStateToUrl() {
    const state = [];
    document.querySelectorAll('.input-row').forEach(row => {
        const textInput = row.querySelector('input[type="text"]').value;
        const colorInput = row.querySelector('input[type="color"]').value;
        const checkbox = row.querySelector('input[type="checkbox"]').checked;
        const matchType = row.querySelector('select').value;

        state.push({text: textInput, color: colorInput, checked: checkbox, matchType: matchType});
    });

    const encodedState = encodeURIComponent(btoa(JSON.stringify(state)));
    window.location.hash = encodedState;
}

function loadStateFromUrl() {
    console.log("Loading state")
    const hash = window.location.hash.substring(1); // Remove the '#' character
    if (!hash) return;

    const state = JSON.parse(atob(decodeURIComponent(hash)));
    state.forEach((item, index) => {
        if (item.text == "") {
            return;
        } 
        // Add a row for each item in the state (you may need to adjust this to match your addRow function)
        if (index > 0) addRow(); // Assuming addRow is your function to add a new row
        
        // Populate the last row with the state of the current item
        const lastRow = document.querySelector('.input-row:last-of-type');
        lastRow.querySelector('input[type="text"]').value = item.text;
        lastRow.querySelector('input[type="color"]').value = item.color;
        lastRow.querySelector('input[type="checkbox"]').checked = item.checked;
        lastRow.querySelector('select').value = item.matchType;
    });
    updateAll();
}

document.addEventListener('DOMContentLoaded', function() {
    loadStateFromUrl(); // Load the state when the page loads
});

function updateAll() {
    document.querySelectorAll('.input-row').forEach(row => {
        const updateButton = row.querySelector('.update-row');
        updateButton.click();
    });

}

function clearAll() {
    document.querySelectorAll('.input-row').forEach(row => {
        const deleteButton = row.querySelector('.remove-row');
        deleteButton.click();
    });
    addRow();
}

function share() {
    saveStateToUrl();
    navigator.clipboard.writeText(window.location);
}

function loadHash(hash) {
    window.location.href = hash;
    // window.location.reload();
    clearAll();
    loadStateFromUrl();
}
window.loadHash = loadHash;