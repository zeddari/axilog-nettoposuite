/**
 * Run with: npx tsx src/db/seeds/run-seed.ts
 * (from the backend/ directory, after .env is loaded)
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createPool } from 'mysql2/promise';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../../../.env') });

const pool = createPool({
  host:     process.env.MYSQL_HOST     ?? '127.0.0.1',
  port:     Number(process.env.MYSQL_PORT ?? 3306),
  user:     process.env.MYSQL_USER     ?? 'root',
  password: process.env.MYSQL_PASSWORD ?? '',
  database: process.env.MYSQL_DATABASE ?? 'netsuite',
  multipleStatements: true,
});

async function run() {
  const conn = await pool.getConnection();
  try {
    console.log('Connected to MySQL. Running demo seed…');

    // ── 1. Topology definitions ────────────────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO topology_definitions
        (id, topo_uuid, name, type, description, layout_algorithm, auto_refresh_seconds)
      VALUES
        ('topo-ipmpls-001','uuid-ipmpls-001','IP/MPLS Core Network','IP_MPLS',
         'National IP/MPLS backbone with PE and P routers','ELK_LAYERED',30),
        ('topo-5gcore-001','uuid-5gcore-001','5G Core Network','5G_CORE',
         '5G Standalone core network functions (AMF, SMF, UPF, NRF)','RADIAL',30),
        ('topo-access-001','uuid-access-001','Access & Aggregation','ACCESS',
         'Metro Ethernet access and aggregation layer','ELK_LAYERED',60)
    `);
    console.log('✔ topology_definitions seeded');

    // ── 2. IP/MPLS nodes ───────────────────────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO topology_nodes
        (id,node_uuid,topology_id,label,type,status,ip_address,vendor,model,properties,pos_x,pos_y,layer)
      VALUES
        ('node-r1','nuuid-r1','topo-ipmpls-001','P-Core-R1','ROUTER','UP','10.0.0.1','Cisco','ASR 9001','{"role":"P","asn":65001}',100,200,'CORE'),
        ('node-r2','nuuid-r2','topo-ipmpls-001','P-Core-R2','ROUTER','UP','10.0.0.2','Cisco','ASR 9001','{"role":"P","asn":65001}',400,200,'CORE'),
        ('node-r3','nuuid-r3','topo-ipmpls-001','P-Core-R3','ROUTER','DEGRADED','10.0.0.3','Juniper','MX480','{"role":"P","asn":65001}',250,80,'CORE'),
        ('node-pe1','nuuid-pe1','topo-ipmpls-001','PE-North-01','ROUTER','UP','10.1.0.1','Cisco','ASR 9006','{"role":"PE","asn":65001,"customers":12}',50,400,'EDGE'),
        ('node-pe2','nuuid-pe2','topo-ipmpls-001','PE-South-01','ROUTER','UP','10.1.0.2','Cisco','ASR 9006','{"role":"PE","asn":65001,"customers":8}',450,400,'EDGE'),
        ('node-pe3','nuuid-pe3','topo-ipmpls-001','PE-East-01','ROUTER','DOWN','10.1.0.3','Juniper','MX204','{"role":"PE","asn":65001,"customers":5}',250,400,'EDGE'),
        ('node-rr1','nuuid-rr1','topo-ipmpls-001','RR-01','ROUTER','UP','10.0.1.1','Cisco','ASR 9010','{"role":"RR","asn":65001}',250,200,'CORE')
    `);
    console.log('✔ IP/MPLS nodes seeded');

    // ── 3. IP/MPLS links ───────────────────────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO topology_links
        (id,link_uuid,topology_id,source_node_id,target_node_id,label,status,bandwidth_mbps,utilization_pct,properties)
      VALUES
        ('link-r1-r2','luuid-r1r2','topo-ipmpls-001','node-r1','node-r2','R1↔R2 100G','UP',100000,45,'{"protocol":"OSPF","metric":10}'),
        ('link-r1-r3','luuid-r1r3','topo-ipmpls-001','node-r1','node-r3','R1↔R3 100G','UP',100000,23,'{"protocol":"OSPF","metric":10}'),
        ('link-r2-r3','luuid-r2r3','topo-ipmpls-001','node-r2','node-r3','R2↔R3 100G','DEGRADED',100000,88,'{"protocol":"OSPF","metric":10}'),
        ('link-r1-rr1','luuid-r1rr1','topo-ipmpls-001','node-r1','node-rr1','R1↔RR','UP',10000,12,'{"protocol":"IBGP"}'),
        ('link-r2-rr1','luuid-r2rr1','topo-ipmpls-001','node-r2','node-rr1','R2↔RR','UP',10000,8,'{"protocol":"IBGP"}'),
        ('link-r1-pe1','luuid-r1pe1','topo-ipmpls-001','node-r1','node-pe1','R1↔PE-N','UP',10000,31,'{"protocol":"OSPF"}'),
        ('link-r2-pe2','luuid-r2pe2','topo-ipmpls-001','node-r2','node-pe2','R2↔PE-S','UP',10000,19,'{"protocol":"OSPF"}'),
        ('link-r3-pe3','luuid-r3pe3','topo-ipmpls-001','node-r3','node-pe3','R3↔PE-E','DOWN',10000,0,'{"protocol":"OSPF"}')
    `);
    console.log('✔ IP/MPLS links seeded');

    // ── 4. 5G Core nodes ───────────────────────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO topology_nodes
        (id,node_uuid,topology_id,label,type,status,ip_address,vendor,model,properties,pos_x,pos_y,layer)
      VALUES
        ('node-nrf','nuuid-nrf','topo-5gcore-001','NRF-01','CORE_NF','UP','172.16.0.1','Ericsson','Cloud NRF','{"nfType":"NRF","capacity":"50k NFs"}',250,50,'CONTROL'),
        ('node-amf','nuuid-amf','topo-5gcore-001','AMF-01','CORE_NF','UP','172.16.0.2','Ericsson','Cloud AMF','{"nfType":"AMF","subscribers":50000}',100,200,'CONTROL'),
        ('node-smf','nuuid-smf','topo-5gcore-001','SMF-01','CORE_NF','UP','172.16.0.3','Nokia','Cloud SMF','{"nfType":"SMF","sessions":200000}',400,200,'CONTROL'),
        ('node-upf1','nuuid-upf1','topo-5gcore-001','UPF-01','CORE_NF','UP','172.16.1.1','Nokia','Cloud UPF','{"nfType":"UPF","throughputGbps":40}',150,380,'USER_PLANE'),
        ('node-upf2','nuuid-upf2','topo-5gcore-001','UPF-02','CORE_NF','DEGRADED','172.16.1.2','Nokia','Cloud UPF','{"nfType":"UPF","throughputGbps":40}',350,380,'USER_PLANE'),
        ('node-ausf','nuuid-ausf','topo-5gcore-001','AUSF-01','CORE_NF','UP','172.16.0.4','Ericsson','Cloud AUSF','{"nfType":"AUSF"}',250,200,'CONTROL'),
        ('node-gnb1','nuuid-gnb1','topo-5gcore-001','gNB-North-01','GNB','UP','192.168.1.1','Huawei','AAU5614','{"bands":["n78","n41"],"cells":3}',100,520,'RAN'),
        ('node-gnb2','nuuid-gnb2','topo-5gcore-001','gNB-South-01','GNB','UP','192.168.1.2','Ericsson','AIR6449','{"bands":["n78"],"cells":3}',400,520,'RAN')
    `);
    console.log('✔ 5G Core nodes seeded');

    // ── 5. 5G Core links ───────────────────────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO topology_links
        (id,link_uuid,topology_id,source_node_id,target_node_id,label,status,bandwidth_mbps,utilization_pct,properties)
      VALUES
        ('link-amf-nrf','luuid-amfnrf','topo-5gcore-001','node-amf','node-nrf','N27','UP',10000,5,'{"interface":"N27"}'),
        ('link-smf-nrf','luuid-smfnrf','topo-5gcore-001','node-smf','node-nrf','N10','UP',10000,4,'{"interface":"N10"}'),
        ('link-ausf-nrf','luuid-ausfnrf','topo-5gcore-001','node-ausf','node-nrf','N13','UP',10000,3,'{"interface":"N13"}'),
        ('link-amf-smf','luuid-amfsmf','topo-5gcore-001','node-amf','node-smf','N11','UP',10000,62,'{"interface":"N11"}'),
        ('link-smf-upf1','luuid-smfupf1','topo-5gcore-001','node-smf','node-upf1','N4','UP',25000,71,'{"interface":"N4"}'),
        ('link-smf-upf2','luuid-smfupf2','topo-5gcore-001','node-smf','node-upf2','N4','DEGRADED',25000,15,'{"interface":"N4"}'),
        ('link-gnb1-amf','luuid-gnb1amf','topo-5gcore-001','node-gnb1','node-amf','N2','UP',10000,55,'{"interface":"N2"}'),
        ('link-gnb2-amf','luuid-gnb2amf','topo-5gcore-001','node-gnb2','node-amf','N2','UP',10000,48,'{"interface":"N2"}'),
        ('link-gnb1-upf1','luuid-gnb1upf1','topo-5gcore-001','node-gnb1','node-upf1','N3','UP',25000,68,'{"interface":"N3"}'),
        ('link-gnb2-upf2','luuid-gnb2upf2','topo-5gcore-001','node-gnb2','node-upf2','N3','DEGRADED',25000,12,'{"interface":"N3"}')
    `);
    console.log('✔ 5G Core links seeded');

    // ── 6. Access network ──────────────────────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO topology_nodes
        (id,node_uuid,topology_id,label,type,status,ip_address,vendor,model,properties,pos_x,pos_y,layer)
      VALUES
        ('node-agg1','nuuid-agg1','topo-access-001','AGG-SW-01','SWITCH','UP','10.100.0.1','Cisco','Catalyst 9500','{"role":"aggregation","ports":48}',200,100,'AGGREGATION'),
        ('node-agg2','nuuid-agg2','topo-access-001','AGG-SW-02','SWITCH','UP','10.100.0.2','Cisco','Catalyst 9500','{"role":"aggregation","ports":48}',400,100,'AGGREGATION'),
        ('node-acc1','nuuid-acc1','topo-access-001','ACC-SW-North','SWITCH','UP','10.100.1.1','Cisco','Catalyst 9300','{"role":"access","ports":24}',100,300,'ACCESS'),
        ('node-acc2','nuuid-acc2','topo-access-001','ACC-SW-East','SWITCH','MAINTENANCE','10.100.1.2','Cisco','Catalyst 9300','{"role":"access","ports":24}',300,300,'ACCESS'),
        ('node-acc3','nuuid-acc3','topo-access-001','ACC-SW-South','SWITCH','UP','10.100.1.3','HP','Aruba 2930F','{"role":"access","ports":48}',500,300,'ACCESS')
    `);
    await conn.query(`
      INSERT IGNORE INTO topology_links
        (id,link_uuid,topology_id,source_node_id,target_node_id,label,status,bandwidth_mbps,utilization_pct,properties)
      VALUES
        ('link-agg1-agg2','luuid-agg12','topo-access-001','node-agg1','node-agg2','AGG uplink','UP',10000,34,'{"type":"lag"}'),
        ('link-agg1-acc1','luuid-a1ac1','topo-access-001','node-agg1','node-acc1','1G','UP',1000,22,'{}'),
        ('link-agg1-acc2','luuid-a1ac2','topo-access-001','node-agg1','node-acc2','1G','UNKNOWN',1000,0,'{}'),
        ('link-agg2-acc3','luuid-a2ac3','topo-access-001','node-agg2','node-acc3','1G','UP',1000,41,'{}')
    `);
    console.log('✔ Access network seeded');

    // ── 7. Alarms ──────────────────────────────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO alarms
        (id,alarm_uuid,topology_id,node_id,severity,title,source,is_cleared)
      VALUES
        ('alarm-001','auuid-001','topo-ipmpls-001','node-pe3','CRITICAL','PE-East-01: Node unreachable — interface GigE0/0/0/0 down','SNMP',0),
        ('alarm-002','auuid-002','topo-ipmpls-001','node-r3','MAJOR','P-Core-R3: High link utilization (88%) on R2↔R3 trunk','SNMP',0),
        ('alarm-003','auuid-003','topo-5gcore-001','node-upf2','MAJOR','UPF-02: N4 interface degraded — SMF session establishment failing','gNMI',0),
        ('alarm-004','auuid-004','topo-ipmpls-001','node-r2','MINOR','P-Core-R2: BGP peer flap detected (2 flaps in 5 min)','SNMP',0),
        ('alarm-005','auuid-005','topo-5gcore-001','node-gnb2','WARNING','gNB-South-01: Handover success rate dropped to 94% (threshold 97%)','OAM',0)
    `);
    console.log('✔ Alarms seeded');

    // ── 8. Catalogue services ──────────────────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO catalogue_services
        (id,service_uuid,name,category,status,health,description,owner,sla_target,topology_id)
      VALUES
        ('svc-001','svuuid-001','National MPLS VPN','Connectivity','active','healthy','Layer 3 MPLS VPN connecting all enterprise branches','NOC Team',99.9,'topo-ipmpls-001'),
        ('svc-002','svuuid-002','5G Mobile Broadband','5G Services','active','degraded','5G SA commercial service — urban coverage','5G Operations',99.5,'topo-5gcore-001'),
        ('svc-003','svuuid-003','Metro Ethernet Access','Connectivity','active','healthy','Business Ethernet access for SME customers','Access Team',99.5,'topo-access-001'),
        ('svc-004','svuuid-004','IoT Connectivity Platform','IoT','maintenance','unknown','NB-IoT and LTE-M platform for IoT devices','IoT Team',99.0,NULL)
    `);
    console.log('✔ Catalogue services seeded');

    console.log('\n🎉 Demo seed complete! Restart the app to see data.');
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(err => { console.error('Seed failed:', err); process.exit(1); });
