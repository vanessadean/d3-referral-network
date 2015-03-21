require 'csv'
require 'json'

class SecondaryParse
  def initialize
    @data = {}
    @data["nodes"] = []
    @data["links"] = []
  end

  def parse_for(doctor, exclude=nil)
    CSV.foreach("../data/DataForVanessa.csv") do |row|
      if row[0] == doctor && row[0] != row[3] && row[4] != exclude
        node1 = @data["nodes"].detect { |node| node["name"] == row[0] }
        node2 = @data["nodes"].detect { |node| node["name"] == row[3] }

        if node1
          node1["total_referrals"] += 1
        else
          @data["nodes"] << {"name" => row[0], "practice" => row[1], "specialty" => row[2], "total_referrals" => 1}
        end

        if node2
          node2["total_referrals"] += 1
        else
          @data["nodes"] << {"name" => row[3], "practice" => row[4], "specialty" => row[5], "total_referrals" => 1}
        end

        unless @data["links"].any? { |link| link == { "source" => row[0], "target" => row[3] } }
          @data["links"] << { "source" => row[0], "target" => row[3] }
          parse_for(row[3], "Premier Orthopaedics")
        end
      end
    end
  end

  def create_json_file(filename)
    File.open("../data/#{filename}.json", 'w') do |file|
      file.puts JSON.pretty_generate(JSON.parse(@data.to_json))
    end
  end
end

parser = SecondaryParse.new
parser.parse_for("Howard Baruch")
parser.create_json_file("baruch-with-secondary")


