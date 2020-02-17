-- DISTRIBUTIONS
INSERT INTO vdimetadata.service_meta_store(api_code,context_code, service_code, meta_json)
VALUES('hostfees', 'distributions', 'all', '{\"dataCode\": \"distributions_all\"}'),
('hostfees', 'distributions', 'getone', '{\"dataCode\": \"distributions_getone\"}'),
('hostfees', 'distributions', 'save', '{\"dataCode\": \"distributions_save\"}')

INSERT INTO vdimetadata.vdimetadata( SOURCE_CODE, API_CODE, CONTEXT_CODE, DATA_CODE, QUERY_METADATA_JSON)
VALUES('hostfees', 'hostfees', 'distributions', 'distributions_save', '{\"that\": {\"where\": \"entity_id IN (@that.entityId)\", \"attributeMap\": {\"entity_id\": \"@that.entityId\", \"is_active\": \"@that.isActive\", \"description\": \"@that.description\", \"entity_code\": \"@that.entityCode\", \"distribution_code\": \"@that.distributionCode\", \"distribution_name\": \"@that.distributionName\"}, \"dataViewCode\": \"distribution_m\", \"updateIgnoreAttributes\": [\"entity_id\", \"entity_code\"]}, \"that.corpDist\": {\"where\": \"distribution_entity_id IN (@that.distributionEntityId) and serial_id IN (@that.id)\", \"attributeMap\": {\"end_date\": \"@that.endDate\", \"serial_id\": \"@that.id\", \"begin_date\": \"@that.beginDate\", \"corp_entity_id\": \"@that.corpEntityId\", \"distribution_entity_id\": \"@that.distributionEntityId\"}, \"dataViewCode\": \"corp_distribution\", \"updateIgnoreAttributes\": [\"corp_entity_id\", \"serial_id\", \"distribution_entity_id\"]}}'),
('hostfees', 'hostfees', 'distributions', 'distributions_all', '{\"this\": {\"attributeMap\": {\"end_date\": \"endDate\", \"corp_name\": \"corpName\", \"entity_id\": \"entityId\", \"is_active\": \"isActive\", \"serial_id\": \"id\", \"begin_date\": \"beginDate\", \"description\": \"description\", \"entity_code\": \"entityCode\", \"distribution_code\": \"distributionCode\", \"distribution_name\": \"distributionName\"}, \"dataViewCode\": \"vdistributionsall\"}}'),
('hostfees', 'hostfees', 'distributions', 'distributions_getone', '{\"this\": {\"where\": \"entity_id IN (@that.entityId)\", \"attributeMap\": {\"entity_id\": \"entityId\", \"is_active\": \"isActive\", \"description\": \"description\", \"entity_code\": \"Entitycode\", \"distribution_code\": \"distributionCode\", \"distribution_name\": \"distributionName\"}, \"dataViewCode\": \"distribution_m\"}, \"this.corpDist\": {\"where\": \"distribution_entity_id IN (@that.entityId)\", \"attributeMap\": {\"end_date\": \"endDate\", \"corp_name\": \"corpName\", \"serial_id\": \"id\", \"begin_date\": \"beginDate\", \"corp_entity_id\": \"corpEntityId\", \"distribution_entity_id\": \"distributionEntityId\"}, \"dataViewCode\": \"vdistributiongetone\"}}')

INSERT INTO vdimetadata.data_views(data_view_code, api_code, source_code, query)
VALUES('vdistributionsall', 'hostfees', 'hostfees', '1', 'select d.*,cd.*,c.corp_name from distribution_m d inner join corp_distribution cd on cd.distribution_entity_id=d.entity_id inner join corporation_m c on c.entity_id=cd.corp_entity_id'),
('vdistributiongetone', 'hostfees', 'hostfees', '1', 'select cd.serial_id, cd.corp_entity_id, cd.distribution_entity_id, cd.begin_date, cd.end_date, c.corp_name from corp_distribution cd inner join corporation_m  c on c.entity_id=cd.corp_entity_id')


-- Country API
INSERT INTO vdimetadata.service_meta_store(api_code,context_code, service_code, meta_json)
VALUES('chrimsmasters', 'country', 'all', '{\"dataCode\": \"country_all\"}')

INSERT INTO vdimetadata.vdimetadata( SOURCE_CODE, API_CODE, CONTEXT_CODE, DATA_CODE, QUERY_METADATA_JSON)
VALUES('hostfees', 'chrimsmasters', 'country', 'country_all', '{\"this\": {\"attributeMap\": {\"is_active\": \"isActive\", \"description\": \"description\", \"country_code\": \"countryCode\", \"country_name\": \"countryName\"}, \"dataViewCode\": \"country_c\"}}')


-- State API by country code
INSERT INTO vdimetadata.service_meta_store(api_code,context_code, service_code, meta_json)
VALUES('chrimsmasters', 'country', 'state', '{\"dataCode\": \"state_by_country_code\"}')

INSERT INTO vdimetadata.vdimetadata( SOURCE_CODE, API_CODE, CONTEXT_CODE, DATA_CODE, QUERY_METADATA_JSON)
VALUES('hostfees', 'chrimsmasters', 'country', 'state_by_country_code', '{\"this\": {\"where\": \"country_code IN (@that.countryCode)\", \"attributeMap\": {\"is_active\": \"isActive\", \"state_code\": \"stateCode\", \"state_name\": \"stateName\", \"description\": \"description\", \"country_code\": \"countryCode\"}, \"dataViewCode\": \"state_c\"}}')


-- City API by state code and country code
INSERT INTO vdimetadata.service_meta_store(api_code,context_code, service_code, meta_json)
VALUES('chrimsmasters', 'country', 'state/city', '{\"dataCode\": \"city_by_state_country\"}')

INSERT INTO vdimetadata.vdimetadata( SOURCE_CODE, API_CODE, CONTEXT_CODE, DATA_CODE, QUERY_METADATA_JSON)
VALUES('hostfees', 'chrimsmasters', 'country', 'city_by_state_country', '{\"this\": {\"where\": \"country_code IN (@that.countryCode) AND state_code IN (@that.stateCode)\", \"attributeMap\": {\"city_code\": \"cityCode\", \"city_name\": \"cityName\", \"is_active\": \"isActive\", \"state_code\": \"stateCode\", \"country_code\": \"countryCode\", \"city_description\": \"description\"}, \"dataViewCode\": \"city_c\"}}')


-- Address Master data API
INSERT INTO vdimetadata.service_meta_store(api_code,context_code, service_code, meta_json)
VALUES('chrimsmasters', 'address', 'all', '{\"dataCode\": \"address_all\"}')

INSERT INTO vdimetadata.vdimetadata( SOURCE_CODE, API_CODE, CONTEXT_CODE, DATA_CODE, QUERY_METADATA_JSON)
VALUES('hostfees', 'chrimsmasters', 'address', 'address_all', '{\"this\": {\"attributeMap\": {\"fax\": \"fax\", \"zip\": \"zip\", \"email\": \"email\", \"phone\": \"phone\", \"city_code\": \"cityCode\", \"entity_id\": \"addressEntityId\", \"is_active\": \"isActive\", \"state_code\": \"stateCode\", \"description\": \"description\", \"web_address\": \"webAddress\", \"country_code\": \"countryCode\", \"address_line1\": \"addressLine1\", \"address_line2\": \"addressLine2\", \"address_type_code\": \"addressTypeCode\"}, \"dataViewCode\": \"address_m\"}}')


INSERT INTO vdimetadata.service_meta_store(api_code,context_code, service_code, meta_json)
VALUES('hostfees', 'contractagent', 'all', '{\"dataCode\": \"contractagent_all\"}'),
('hostfees', 'contractagent', 'getone', '{\"dataCode\": \"contractagent_getone\"}'),
('hostfees', 'contractagent', 'save', '{\"dataCode\": \"contractagent_save\"}')

INSERT INTO vdimetadata.vdimetadata( SOURCE_CODE, API_CODE, CONTEXT_CODE, DATA_CODE, QUERY_METADATA_JSON)
VALUES('hostfees', 'hostfees', 'distributions', 'distributions_save', '{\"that\": {\"where\": \"entity_id IN (@that.entityId)\", \"attributeMap\": {\"entity_id\": \"@that.entityId\", \"is_active\": \"@that.isActive\", \"description\": \"@that.description\", \"entity_code\": \"@that.entityCode\", \"distribution_code\": \"@that.distributionCode\", \"distribution_name\": \"@that.distributionName\"}, \"dataViewCode\": \"distribution_m\", \"updateIgnoreAttributes\": [\"entity_id\", \"entity_code\"]}, \"that.corpDist\": {\"where\": \"distribution_entity_id IN (@that.distributionEntityId) and serial_id IN (@that.id)\", \"attributeMap\": {\"end_date\": \"@that.endDate\", \"serial_id\": \"@that.id\", \"begin_date\": \"@that.beginDate\", \"corp_entity_id\": \"@that.corpEntityId\", \"distribution_entity_id\": \"@that.distributionEntityId\"}, \"dataViewCode\": \"corp_distribution\", \"updateIgnoreAttributes\": [\"corp_entity_id\", \"serial_id\", \"distribution_entity_id\"]}}'),
('hostfees', 'hostfees', 'distributions', 'distributions_all', '{\"this\": {\"attributeMap\": {\"end_date\": \"endDate\", \"corp_name\": \"corpName\", \"entity_id\": \"entityId\", \"is_active\": \"isActive\", \"serial_id\": \"id\", \"begin_date\": \"beginDate\", \"description\": \"description\", \"entity_code\": \"entityCode\", \"distribution_code\": \"distributionCode\", \"distribution_name\": \"distributionName\"}, \"dataViewCode\": \"vdistributionsall\"}}'),
('hostfees', 'hostfees', 'distributions', 'distributions_getone', '{\"this\": {\"where\": \"entity_id IN (@that.entityId)\", \"attributeMap\": {\"entity_id\": \"entityId\", \"is_active\": \"isActive\", \"description\": \"description\", \"entity_code\": \"Entitycode\", \"distribution_code\": \"distributionCode\", \"distribution_name\": \"distributionName\"}, \"dataViewCode\": \"distribution_m\"}, \"this.corpDist\": {\"where\": \"distribution_entity_id IN (@that.entityId)\", \"attributeMap\": {\"end_date\": \"endDate\", \"corp_name\": \"corpName\", \"serial_id\": \"id\", \"begin_date\": \"beginDate\", \"corp_entity_id\": \"corpEntityId\", \"distribution_entity_id\": \"distributionEntityId\"}, \"dataViewCode\": \"vdistributiongetone\"}}')
