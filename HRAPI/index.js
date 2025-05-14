const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();
const app = express();
app.use(cors());
app.use(express.json());

app.get('/',async(req,res)=>{
    try{
        res.json('WELCOME TO HR API')
    }catch(err){
        res.status(500).json({Error:err.message})
    }
});

app.get('/record',async(req,res)=>{
    try{
       const result = await pool.query('select r.region_id,r.region_name, c.country_id,c.country_name,l.location_id,l.postal_code,l.city from regions r inner join countries c on r.region_id = c.region_id inner join locations l on c.country_id =l.country_id limit 2');
       res.json(result.rows);
    }catch(err){
        res.status(500).json({Error:err.message})
    }
});

app.get('/country',async(req,res)=>{
    try{
       const result = await pool.query('select * from countries');
       res.json(result.rows);
    }catch(err){
        res.status(500).json({Error:err.message})
    }
});

app.get('/employee',async(req,res)=>{
    try{
        const result = await pool.query('select * from employees');
        res.json(result.rows);
    }catch(err){
        res.status(500).json({Error:err.message})
    }
});
 app.get('/totalcounts', async (req, res) => {
    try {
        const employeeResult = await pool.query(`select count(employee_id) as total_employees from employees`);
        const countriesResult = await pool.query(`select count(country_id) as total_countries from countries`);
        const jobResult = await pool.query(`select count(job_id) as total_jobs from jobs`);
        const deptResult = await pool.query(`select count(department_id) as total_departments from departments`);
        const locationResult = await pool.query(`select count(location_id) as total_locations from locations`);
        const regionResult = await pool.query(`select count(region_id) as total_regions from regions`);
        const jobHistoryResult = await pool.query("SELECT COUNT(*) AS total_job_history FROM job_history");

         const counts = {
            employees: employeeResult.rows[0].total_employees,
            countries: countriesResult.rows[0].total_countries,
            jobs: jobResult.rows[0].total_jobs,
            dept: deptResult.rows[0].total_departments,
            location: locationResult.rows[0].total_locations,
            regions: regionResult.rows[0].total_regions,
            job_history : jobHistoryResult.rows[0].total_job_history
        };
        res.json(counts);

    } catch (err) {
        res.status(500).json({ Error: err.message })
    }
});
app.get('/employee',async(req,res)=>{
    try{
       const result = await pool.query('select count(employee_id) from employees');
       res.json(result.rows);
    }catch(err){
        res.status(500).json({Error:err.message})
    }
});

app.get('/job',async(req,res)=>{
    try{
       const result = await pool.query('select * from jobs');
       res.json(result.rows);
    }catch(err){
        res.status(500).json({Error:err.message})
    }
});

app.get('/department',async(req,res)=>{
    try{
       const result = await pool.query('select * from departments');
       res.json(result.rows);
    }catch(err){
        res.status(500).json({Error:err.message})
    }
});

app.get('/totalemp',async(req,res)=>{
    try{
       const result = await pool.query('select count(employee_id) from employees');
       res.json(result.rows);
    }catch(err){
        res.status(500).json({Error:err.message})
    }
});

app.get('/totalcrty',async(req,res)=>{
    try{
       const result = await pool.query('select count(country_id) from countries');
       res.json(result.rows);
    }catch(err){
        res.status(500).json({Error:err.message})
    }
});

app.get('/totalloc',async(req,res)=>{
    try{
       const result = await pool.query('select count(location_id) from locations');
       res.json(result.rows);
    }catch(err){
        res.status(500).json({Error:err.message})
    }
});

app.get('/totaldep',async(req,res)=>{
    try{
       const result = await pool.query('select count(department_id) from departments');
       res.json(result.rows);
    }catch(err){
        res.status(500).json({Error:err.message})
    }
});

app.get('/totaljob',async(req,res)=>{
    try{
       const result = await pool.query('select count(job_id) from jobs');
       res.json(result.rows);
    }catch(err){
        res.status(500).json({Error:err.message})
    }
});

app.get('/totalregion',async(req,res)=>{
    try{
       const result = await pool.query('select count(region_id) from regions');
       res.json(result.rows);
    }catch(err){
        res.status(500).json({Error:err.message})
    }
});

app.get('/location',async(req,res)=>{
    try{
       const result = await pool.query('select * from locations');
       res.json(result.rows);
    }catch(err){
        res.status(500).json({Error:err.message})
    }
});

const PORT = process.env.PORT || 6009;
app.listen(PORT,()=>{
    console.log(`Connected Successfully...on PORT ${PORT}`)
});