const Link = "https://psychic-space-doodle-7vw67vxg94p5cx9x-5005.app.github.dev/employee";

fetch(Link).then(response=>{
    if(!response.ok){
        throw new Error("Failed To Fetch Data");
    }
    return response.json();
}).then(data=>{
    const tbody = document.querySelector("#employeetable tbody");

    data.forEach(c=>{
        const row = document.createElement("tr");
        row.innerHTML=`
        <td>${c.employee_id}</td>
        <td>${c.first_name}</td>
        <td>${c.last_name}</td>
        <td>${c.department_id}</td>
        <td>${c.commission_pct}</td>
        <td>${c.salary}</td>
        <td>${c.hire_date}</td>
        `;
        tbody.appendChild(row);
    });
}).catch(err=>{
    console.log(err.message);
});